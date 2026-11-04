package com.eva.locafesta.termo;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/termos")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TermoController {

    private final TermoService termoService;

    /** Público: versão publicada vigente por audiência. */
    @GetMapping("/{tipo}/vigente")
    public ResponseEntity<TermoDTO> vigente(@PathVariable String tipo) {
        return ResponseEntity.ok(termoService.vigente(tipo));
    }

    /**
     * Aceita termos vigentes. O usuário vem do Firebase (SecurityContext);
     * nunca de ID no corpo ou cabeçalho.
     */
    @PostMapping("/aceitar")
    public ResponseEntity<Void> aceitar(@RequestBody(required = false) AceiteRequestDTO dto) {
        termoService.aceitar(dto);
        return ResponseEntity.noContent().build();
    }

    /** Termos publicados que o usuário autenticado ainda não aceitou. */
    @GetMapping("/pendente")
    public ResponseEntity<TermoPendenteDTO> pendente() {
        return ResponseEntity.ok(termoService.pendente());
    }
}
