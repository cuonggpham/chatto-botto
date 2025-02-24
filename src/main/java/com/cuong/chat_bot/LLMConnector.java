package com.cuong.chat_bot;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
public class LLMConnector {

    private final WebClient webClient;

    @Value("${gemini.api.key}")
    private String apiKey;

    public LLMConnector(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.baseUrl("https://generativelanguage.googleapis.com").build();
    }

    public Flux<String> respond(String prompt) {
        return webClient.post()
                .uri(uriBuilder -> uriBuilder
                        .path("/v1beta/models/gemini-pro:generateContent")
                        .queryParam("key", apiKey)
                        .build())
                .bodyValue(Map.of("contents", List.of(Map.of("parts", List.of(Map.of("text", prompt))))))
                .retrieve()
                .bodyToMono(Map.class)
                .flatMapMany(response -> {
                    // Kiểm tra response và ép kiểu an toàn
                    Object candidatesObj = response.get("candidates");
                    if (!(candidatesObj instanceof List)) {
                        return Flux.empty();
                    }
                    List<Map<String, Object>> candidates = (List<Map<String, Object>>) candidatesObj;

                    if (candidates.isEmpty()) {
                        return Flux.empty();
                    }

                    // Lấy phần "content"
                    Object contentObj = candidates.get(0).get("content");
                    if (!(contentObj instanceof Map)) {
                        return Flux.empty();
                    }
                    Map<String, Object> content = (Map<String, Object>) contentObj;

                    // Lấy phần "parts"
                    Object partsObj = content.get("parts");
                    if (!(partsObj instanceof List)) {
                        return Flux.empty();
                    }
                    List<Map<String, Object>> parts = (List<Map<String, Object>>) partsObj;

                    return Flux.fromIterable(parts)
                            .map(part -> (String) part.get("text"))
                            .delayElements(Duration.ofMillis(250)); // Tạo hiệu ứng phản hồi theo luồng
                });
    }
}
