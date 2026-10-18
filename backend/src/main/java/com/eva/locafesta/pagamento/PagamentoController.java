package com.eva.locafesta.pagamento;

import com.mercadopago.MercadoPagoConfig;
import com.mercadopago.client.preference.*;
import com.mercadopago.resources.preference.Preference;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/pagamentos")
@CrossOrigin(origins = "*") // Ajuste conforme seu CORS
public class PagamentoController {

    @Value("${mercadopago.access.token}")
    private String accessToken;

    @PostMapping("/criar-preferencia")
    public ResponseEntity<?> criarPreferencia(@RequestBody Map<String, Object> dadosReserva) {
        try {
            // Configura o Token de Acesso do Mercado Pago
            MercadoPagoConfig.setAccessToken(accessToken);

            // 1. Define o item que está sendo alugado
            PreferenceItemRequest itemRequest = PreferenceItemRequest.builder()
                    .id(dadosReserva.get("reservaId").toString())
                    .title("Reserva de Espaço - " + dadosReserva.get("nomeEspaco"))
                    .quantity(1)
                    .unitPrice(new BigDecimal(dadosReserva.get("valorTotal").toString()))
                    .currencyId("BRL")
                    .build();

            List<PreferenceItemRequest> items = new ArrayList<>();
            items.add(itemRequest);

            // 2. Define URLs de retorno após a conclusão no modal
            PreferenceBackUrlsRequest backUrls = PreferenceBackUrlsRequest.builder()
                    .success("http://localhost:5173/reserva/sucesso")
                    .failure("http://localhost:5173/reserva/falha")
                    .pending("http://localhost:5173/reserva/pendente")
                    .build();

            // 3. Monta a preferência
            PreferenceRequest preferenceRequest = PreferenceRequest.builder()
                    .items(items)
                    .backUrls(backUrls)
                    .externalReference(dadosReserva.get("reservaId").toString()) // Guarda o ID da sua reserva
                    .build();

            PreferenceClient client = new PreferenceClient();
            Preference preference = client.create(preferenceRequest);

            // Retorna o ID da preferência e os links para o React
            return ResponseEntity.ok(Map.of(
    "preferenceId", preference.getId(),
    "initPoint", preference.getInitPoint(),
    "sandboxInitPoint", preference.getSandboxInitPoint()
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
            }
