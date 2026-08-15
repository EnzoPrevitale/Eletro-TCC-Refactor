package com.eln23.tccbackend.controllers;

import com.eln23.tccbackend.services.MicroserviceClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController("/health")
public class HealthController {

    private final MicroserviceClient client;

    public HealthController(MicroserviceClient client) {
        this.client = client;
    }

    @GetMapping
    public String healthCheck() {
        return "OK";
    }

    @GetMapping("/micro")
    public String microserviceHealthCheck() throws IOException, InterruptedException {
        return client.health();
    }

}
