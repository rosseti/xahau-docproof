#include "hookapi.h"

// Parâmetros para identificar a operação
#define PARAM_REGISTER "REGISTER"
#define PARAM_SIGN "SIGN"

int64_t hook(int32_t reserved ) {
    TRACESTR("Docproof.c: Called.");

    // Buffer para parâmetros e dados
    uint8_t param_buffer[32];
    uint8_t doc_hash[32];
    
    // Obtém o parâmetro da operação
    int64_t param_size = otxn_param(SBUF(param_buffer), sfHookParameterName, 20);
    if (param_size < 0)
        rollback(SBUF("Parâmetro da operação não encontrado"), 1);
    
    // Obtém o hash do documento do campo Blob
    int64_t blob_size = otxn_field(SBUF(doc_hash), sfBlob);
    if (blob_size < 0)
        rollback(SBUF("Hash do documento não encontrado"), 2);

    if (blob_size < 0)
        rollback(SBUF("Hash do documento não encontrado"), 2);
    
    // Verifica se é operação de REGISTRO
    if (BUFFER_EQUAL_20(param_buffer, PARAM_REGISTER)) {
        // Verifica se o hash já está registrado
        uint8_t existing_value[32];
        int64_t existing = state(SBUF(existing_value), SBUF(doc_hash));
        if (existing >= 0)
            rollback(SBUF("Documento já registrado"), 3);
        
        // Registra o novo hash
        if (state_set(SBUF(doc_hash), SBUF(doc_hash)) < 0)
            rollback(SBUF("Erro ao registrar documento"), 4);
        
        accept(SBUF("Documento registrado com sucesso"), 0);
        return 0;
    }
    
    // Verifica se é operação de ASSINATURA
    if (BUFFER_EQUAL_20(param_buffer, PARAM_SIGN)) {
        // Verifica se o documento existe
        uint8_t existing_value[32];
        int64_t existing = state(SBUF(existing_value), SBUF(doc_hash));
        if (existing < 0)
            rollback(SBUF("Documento não encontrado para assinatura"), 5);
        
        // Obtém a conta do assinante
        uint8_t signer_acc[20];
        hook_account(SBUF(signer_acc));
        
        // Gera uma chave única para a assinatura (hash + conta)
        uint8_t signature_key[52]; // 32 bytes do hash + 20 bytes da conta
        for (int i = 0; i < GUARD(32); ++i)
            signature_key[i] = doc_hash[i];
        for (int i = 0; i < GUARD(20); ++i)
            signature_key[i + 32] = signer_acc[i];
        
        // Verifica se já assinou
        uint8_t existing_sig[32];
        if (state(SBUF(existing_sig), SBUF(signature_key)) >= 0)
            rollback(SBUF("Documento já assinado por esta conta"), 6);
        
        // Obtém o hash da transação atual como prova da assinatura
        uint8_t tx_hash[32];
        otxn_field(SBUF(tx_hash), sfTransactionHash);
        
        // Registra a assinatura
        if (state_set(SBUF(signature_key), SBUF(tx_hash)) < 0)
            rollback(SBUF("Erro ao registrar assinatura"), 7);
        
        accept(SBUF("Documento assinado com sucesso"), 0);
        return 0;
    }
    
    // Se chegou aqui, operação inválida
    rollback(SBUF("Operação inválida"), 8);
    
    _g(1,1); 

    return 0;
}