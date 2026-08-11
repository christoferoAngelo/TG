package com.eva.locafesta;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class LocafestaApplication {

    public static void main(String[] args) {
        SpringApplication.run(LocafestaApplication.class, args);
    }

}