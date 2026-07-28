package com.eva.locafesta.endereco;


import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Service
public class GeocodingService {

    /**
     * Preenche automaticamente a latitude e longitude no EnderecoDTO
     * se elas já não tiverem sido enviadas pelo frontend.
     */
    public void preencherCoordenadas(EnderecoDTO dto) {
        // Se o frontend já mandou as coordenadas (ex: via GPS do celular), não fazemos nada!
        if (dto == null || (dto.getLatitude() != null && dto.getLongitude() != null)) {
            return;
        }

        try {
            // Monta o endereço: "Rua Exemplo, 123, Guarulhos, SP, Brasil"
            String query = String.format("%s, %s, %s, %s, Brasil",
                    dto.getLogradouro(), dto.getNumero(), dto.getCidade(), dto.getEstado());

            String url = "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" 
                         + query.replace(" ", "+");

            RestTemplate restTemplate = new RestTemplate();

            // O Nominatim exige um cabeçalho "User-Agent" para não bloquear a requisição (HTTP 403)
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "LocaFesta-App/1.0");
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);

            if (response.getBody() != null) {
                ObjectMapper mapper = new ObjectMapper();
                JsonNode root = mapper.readTree(response.getBody());

                // Se encontrou algum resultado na API
                if (root.isArray() && root.size() > 0) {
                    JsonNode location = root.get(0);
                    dto.setLatitude(location.get("lat").asDouble());
                    dto.setLongitude(location.get("lon").asDouble());
                }
            }
        } catch (Exception e) {
            // Se a API externa falhar ou estiver fora do ar, o log avisa, 
            // mas o cadastro do usuário/espaço NÃO é cancelado.
            System.err.println("Falha ao buscar coordenadas do endereço: " + e.getMessage());
        }
    }
}