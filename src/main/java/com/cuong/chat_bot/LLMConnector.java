package com.cuong.chat_bot;

import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.time.Duration;

@Service
public class LLMConnector {
    public Flux<String> respond(String prompt){
        return Flux.interval(Duration.ofMillis(250))
                .take(15)
                .map(seq -> "Respond token " + (seq+1)+ " for question:" + prompt); //Tokens
    }
}
