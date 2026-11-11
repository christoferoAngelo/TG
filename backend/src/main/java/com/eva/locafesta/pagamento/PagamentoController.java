package com.eva.locafesta.pagamento;

import com.eva.locafesta.reserva.ReservaResponseDTO;
import com.eva.locafesta.reserva.ReservaService;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.mercadopago.MercadoPagoConfig;
import com.mercadopago.client.preference.PreferenceBackUrlsRequest;
import com.mercadopago.client.preference.PreferenceClient;
import com.mercadopago.client.preference.PreferenceItemRequest;
import com.mercadopago.client.preference.PreferenceRequest;
import com.mercadopago.resources.preference.Preference;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/pagamentos")
@CrossOrigin(origins = "*")
public class PagamentoController {

    private final ReservaService reservaService;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    @Value("${mercadopago.access.token}")
    private String accessToken;

    @Value("${locafesta.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public PagamentoController(ReservaService reservaService, ObjectMapper objectMapper) {
        this.reservaService = reservaService;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/criar-preferencia")
    public ResponseEntity<?> criarPreferencia(@RequestBody Map<String, Object> dadosReserva) {
        try {
            MercadoPagoConfig.setAccessToken(accessToken);

            PreferenceItemRequest itemRequest = PreferenceItemRequest.builder()
                    .id(dadosReserva.get("reservaId").toString())
                    .title("Reserva de Espaço - " + dadosReserva.get("nomeEspaco"))
                    .quantity(1)
                    .unitPrice(new BigDecimal(dadosReserva.get("valorTotal").toString()))
                    .currencyId("BRL")
                    .build();

            List<PreferenceItemRequest> items = new ArrayList<>();
            items.add(itemRequest);

            String base = frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
            PreferenceBackUrlsRequest backUrls = PreferenceBackUrlsRequest.builder()
                    .success(base + "/pagamento/sucesso")
                    .failure(base + "/pagamento/falha")
                    .pending(base + "/pagamento/pendente")
                    .build();

            // auto_return exige back_urls públicas. Com localhost o MP ignora as URLs
            // e responde 400 invalid_auto_return — então só usa auto_return fora do local.
            boolean frontendLocal = base.contains("localhost") || base.contains("127.0.0.1");
            PreferenceRequest.PreferenceRequestBuilder preferencia = PreferenceRequest.builder()
                    .items(items)
                    .backUrls(backUrls)
                    .externalReference(dadosReserva.get("reservaId").toString());
            if (!frontendLocal) {
                preferencia.autoReturn("approved");
            }

            PreferenceClient client = new PreferenceClient();
            Preference preference = client.create(preferencia.build());

            return ResponseEntity.ok(Map.of(
                    "preferenceId", preference.getId(),
                    "initPoint", preference.getInitPoint() != null ? preference.getInitPoint() : "",
                    "sandboxInitPoint", preference.getSandboxInitPoint() != null ? preference.getSandboxInitPoint() : ""
            ));
        } catch (com.mercadopago.exceptions.MPApiException e) {
            System.err.println("MP status: " + e.getApiResponse().getStatusCode());
            System.err.println("MP body: " + e.getApiResponse().getContent());
            return ResponseEntity.status(502).body(Map.of("erro", e.getApiResponse().getContent()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("erro", e.getMessage()));
        }
    }

    /**
     * Confirma pagamento no retorno do Checkout.
     * Em produção o ideal é validar via webhook do Mercado Pago.
     */
    @PostMapping("/confirmar")
    public ResponseEntity<?> confirmar(@RequestBody Map<String, Object> corpo) {
        try {
            Object rawId = corpo.get("reservaId");
            if (rawId == null) {
                return ResponseEntity.badRequest().body(Map.of("erro", "reservaId obrigatório"));
            }
            Long reservaId = Long.valueOf(rawId.toString());
            ReservaResponseDTO atualizada = reservaService.marcarPago(reservaId);
            return ResponseEntity.ok(atualizada);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    /**
     * Consulta o Mercado Pago e, se houver pagamento aprovado para a reserva, marca como pago.
     * Útil no localhost, onde o auto_return não funciona.
     */
    @PostMapping("/sincronizar")
    public ResponseEntity<?> sincronizar(@RequestBody Map<String, Object> corpo) {
        try {
            Object rawId = corpo.get("reservaId");
            Object rawPaymentId = corpo.get("paymentId");
            if (rawId == null && rawPaymentId == null) {
                return ResponseEntity.badRequest().body(Map.of("erro", "reservaId ou paymentId obrigatório"));
            }

            JsonNode pagamento = null;
            if (rawPaymentId != null && !String.valueOf(rawPaymentId).isBlank()
                    && !"null".equalsIgnoreCase(String.valueOf(rawPaymentId))) {
                pagamento = buscarPagamentoPorId(String.valueOf(rawPaymentId));
            }

            Long reservaId = rawId != null ? Long.valueOf(rawId.toString()) : null;
            if (pagamento == null && reservaId != null) {
                pagamento = buscarPagamentoAprovadoPorReserva(reservaId);
            }

            if (pagamento == null) {
                return ResponseEntity.ok(Map.of(
                        "pago", false,
                        "mensagem", "Nenhum pagamento aprovado encontrado no Mercado Pago."
                ));
            }

            String status = textOrEmpty(pagamento, "status");
            if (!"approved".equalsIgnoreCase(status)) {
                return ResponseEntity.ok(Map.of(
                        "pago", false,
                        "status", status,
                        "mensagem", "Pagamento ainda não aprovado no Mercado Pago."
                ));
            }

            if (reservaId == null) {
                String ref = textOrEmpty(pagamento, "external_reference");
                if (ref.isBlank()) {
                    return ResponseEntity.badRequest().body(Map.of("erro", "Pagamento sem external_reference"));
                }
                reservaId = Long.valueOf(ref);
            }

            ReservaResponseDTO atualizada = reservaService.marcarPago(reservaId);
            return ResponseEntity.ok(Map.of(
                    "pago", true,
                    "paymentId", textOrEmpty(pagamento, "id"),
                    "reserva", atualizada
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(502).body(Map.of("erro", e.getMessage()));
        }
    }

    private JsonNode buscarPagamentoPorId(String paymentId) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.mercadopago.com/v1/payments/" + URLEncoder.encode(paymentId, StandardCharsets.UTF_8)))
                .timeout(Duration.ofSeconds(20))
                .header("Authorization", "Bearer " + accessToken)
                .GET()
                .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            throw new IllegalStateException("Mercado Pago payment " + paymentId + ": HTTP " + response.statusCode());
        }
        return objectMapper.readTree(response.body());
    }

    private JsonNode buscarPagamentoAprovadoPorReserva(Long reservaId) throws Exception {
        String url = "https://api.mercadopago.com/v1/payments/search"
                + "?sort=date_created&criteria=desc"
                + "&external_reference=" + URLEncoder.encode(reservaId.toString(), StandardCharsets.UTF_8)
                + "&status=approved";
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(20))
                .header("Authorization", "Bearer " + accessToken)
                .GET()
                .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            throw new IllegalStateException("Mercado Pago search: HTTP " + response.statusCode() + " " + response.body());
        }
        JsonNode root = objectMapper.readTree(response.body());
        JsonNode results = root.get("results");
        if (results == null || !results.isArray() || results.isEmpty()) {
            return null;
        }
        return results.get(0);
    }

    private static String textOrEmpty(JsonNode node, String field) {
        JsonNode value = node.get(field);
        return value == null || value.isNull() ? "" : value.asText();
    }
}
