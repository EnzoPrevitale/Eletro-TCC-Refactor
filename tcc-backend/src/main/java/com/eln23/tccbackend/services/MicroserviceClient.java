package com.eln23.tccbackend.services;

import com.eln23.tccbackend.dtos.request.TrialRequestDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.ConnectException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.UUID;

@Component
public class MicroserviceClient {

        private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(java.time.Duration.ofSeconds(5))
            .build();
    private final ObjectMapper objectMapper;
    private final String microserviceUrl;

    public MicroserviceClient(ObjectMapper objectMapper,
                              @Value("${tcc.microservice.url:http://localhost:8000}") String microserviceUrl) {
        this.objectMapper = objectMapper;
        this.microserviceUrl = microserviceUrl.replaceAll("/$", "");
    }

    public String health() throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(microserviceUrl + "/health"))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .GET()
                .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return response.body();
    }

    public UUID startTrial(TrialRequestDto trial) {
        try {
            String body = objectMapper.writeValueAsString(trial);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(microserviceUrl + "/start"))
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode responseBody = objectMapper.readTree(response.body());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                String detail = responseBody.path("error").asText("Microservico nao iniciou o teste");
                throw new MicroserviceException(detail);
            }
            return UUID.fromString(responseBody.path("id").asText());
        } catch (ConnectException exception) {
            throw new MicroserviceException(
                "Microservico Python inacessivel em " + microserviceUrl
                    + ". Inicie tcc-micro/api.py no Windows e verifique a porta 8000.", exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new MicroserviceException("A comunicacao com o microservico foi interrompida", exception);
        } catch (IOException | IllegalArgumentException exception) {
            throw new MicroserviceException("Nao foi possivel iniciar o teste pelo microservico", exception);
        }
    }

    public static class MicroserviceException extends RuntimeException {
        public MicroserviceException(String message) {
            super(message);
        }

        public MicroserviceException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
