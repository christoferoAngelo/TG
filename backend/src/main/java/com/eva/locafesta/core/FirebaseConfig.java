package com.eva.locafesta.core;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.io.InputStream;
import java.io.IOException;

@Configuration
public class FirebaseConfig {

    @PostConstruct
    public void initializeFirebase() throws IOException {

        if (!FirebaseApp.getApps().isEmpty()) {
            return;
        }

   InputStream serviceAccount =
        getClass().getClassLoader()
                .getResourceAsStream("firebase-service-account.json");

if (serviceAccount == null) {
    throw new IOException(
        "firebase-service-account.json não encontrado em src/main/resources"
    );
}
        FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                .build();

        FirebaseApp.initializeApp(options);

        System.out.println("========================================");
        System.out.println("FIREBASE ADMIN SDK INICIALIZADO");
        System.out.println("========================================");
    }
}