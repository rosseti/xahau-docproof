#include "hookapi.h"

/**
 * docproof.c - Secure document signing on Xahau Blockchain Network.
 *
 * Author: Andrei Rosseti
 * Date: 12 Nov 2024
 *
 */

typedef struct DPSignature
{
    uint8_t signer_acc[20];
    uint8_t doc_hash[32];
} Signature;

int64_t hook(int32_t reserved)
{
    TRACESTR("Docproof.c: Called.");

    Signature sig;

    uint8_t doc_id[32];
    int64_t doc_id_size = otxn_param(SBUF(doc_id), "DocId", 5);

    TRACEVAR(doc_id_size);

    if (doc_id_size < 32)
        accept(SBUF("DP: Incoming txn without docId, passing."), __LINE__);

    int64_t param_dochash_size = otxn_param(SBUF(sig.doc_hash), "DocHash", 7);
    TRACEVAR(param_dochash_size);
    TRACEHEX(sig.doc_hash);

    if (param_dochash_size < 32)
        accept(SBUF("DP: Incoming txn without dochash, passing."), __LINE__);

    uint8_t state_key_len = 52;
    uint8_t state_key[state_key_len], state_key_hex[32];

    int64_t signer_acc_size = otxn_field(SBUF(sig.signer_acc), sfAccount);

    for (int i = 0; GUARD(32), i < 32; i++)
        state_key[i] = sig.doc_hash[i];

    for (int i = 0; GUARD(32), i < 32; i++)
        state_key[i + 32] = doc_id[i];

    for (int i = 0; GUARD(20), i < 20; i++)
        state_key[i + 32 + 32] = sig.signer_acc[i];

    if (util_sha512h(SBUF(state_key_hex), SBUF(state_key)) < 0)
        rollback(SBUF("DP: Could not compute sha512 over the submitted txn."), __LINE__);

    Signature sig2;
    int64_t existing = state(SVAR(sig2), SBUF(state_key_hex));
    if (existing > 0)
    {
        TRACEHEX(sig2.doc_hash);
        TRACEHEX(sig2.signer_acc);
        rollback(SBUF("DP: Document already signed."), __LINE__);
    }

    TRACEHEX(sig.doc_hash);
    TRACEHEX(sig.signer_acc);

    if (state_set(SVAR(sig), SBUF(state_key_hex)) < 0)
        rollback(SBUF("DP: Error registering signature"), __LINE__);

    accept(SBUF("DP: Document signed successfully"), 0);

    _g(1, 1);

    return 0;
}
