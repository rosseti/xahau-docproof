#include "hookapi.h"

#define PARAM_REGISTER "REGISTER"
#define PARAM_SIGN "SIGN"

int64_t hook(int32_t reserved ) {
    TRACESTR("Docproof.c: Called.");

    uint8_t param_buffer[32];
    uint8_t doc_hash[32];
    
    int64_t param_size = otxn_param(SBUF(param_buffer), sfHookParameterName, 20);
    if (param_size < 0)
        rollback(SBUF("Operation parameter not found"), 1);
    
    int64_t blob_size = otxn_field(SBUF(doc_hash), sfBlob);
    if (blob_size < 0)
        rollback(SBUF("Document hash not found"), 2);

    if (blob_size < 0)
        rollback(SBUF("Document hash not found"), 2);
    
    if (BUFFER_EQUAL_20(param_buffer, PARAM_REGISTER)) {
        uint8_t existing_value[32];
        int64_t existing = state(SBUF(existing_value), SBUF(doc_hash));
        if (existing >= 0)
            rollback(SBUF("Document already registered"), 3);
        
        if (state_set(SBUF(doc_hash), SBUF(doc_hash)) < 0)
            rollback(SBUF("Error registering document"), 4);
        
        accept(SBUF("Document registered successfully"), 0);
        return 0;
    }
    
    if (BUFFER_EQUAL_20(param_buffer, PARAM_SIGN)) {
        uint8_t existing_value[32];
        int64_t existing = state(SBUF(existing_value), SBUF(doc_hash));
        if (existing < 0)
            rollback(SBUF("Document not found for signing"), 5);
        
        uint8_t signer_acc[20];
        int64_t signer_acc_size = otxn_field(SBUF(signer_acc), sfAccount);
        if (signer_acc_size < 0)
            rollback(SBUF("Error getting sender account"), 3);
        
        uint8_t signature_key[52];
        for (int i = 0; i < GUARD(32); ++i)
            signature_key[i] = doc_hash[i];
        for (int i = 0; i < GUARD(20); ++i)
            signature_key[i + 32] = signer_acc[i];
        
        uint8_t existing_sig[32];
        if (state(SBUF(existing_sig), SBUF(signature_key)) >= 0)
            rollback(SBUF("Document already signed by this account"), 6);
        
        uint8_t tx_hash[32];
        otxn_field(SBUF(tx_hash), sfTransactionHash);
        
        if (state_set(SBUF(signature_key), SBUF(tx_hash)) < 0)
            rollback(SBUF("Error registering signature"), 7);
        
        accept(SBUF("Document signed successfully"), 0);
        return 0;
    }
    
    rollback(SBUF("Invalid operation"), 8);
    
    _g(1,1); 

    return 0;
}

