package com.cuong.chat_bot;

import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;


@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ConversationController {

    private final LLMConnector llmConnector;

    @PostMapping(value = "/conversation", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<String>> chat(@RequestBody PromptRequest request) {
        // Return SSEs
        return llmConnector.respond(request.getContent())
                .map(token -> ServerSentEvent.<String>builder()
                        .event("delta")
                        .data(token)
                        .build());

        // TODO
        // At the beginning of the stream, return small chucks fast.
        // After some time, return batches of tokens.
    }
}