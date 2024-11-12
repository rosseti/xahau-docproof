#include "hookapi.h"

#define PARAM_REGISTER "REGISTER"
#define PARAM_SIGN "SIGN"

#define MAX_MEMO_SIZE 4096

int64_t hook(int32_t reserved)
{
    TRACESTR("Docproof.c: Called.");

    uint8_t param_buffer[9];
    uint8_t doc_hash[32];

    int64_t param_size = otxn_param(SBUF(param_buffer), "operation", 9);

    if (param_size < 0)
        rollback(SBUF("Operation parameter not found"), 1);

    uint8_t memos[MAX_MEMO_SIZE];
    int64_t memos_len = otxn_field(SBUF(memos), sfMemos);

    if (memos_len <= 0)
        accept(SBUF("Blacklist: Passing non-memo incoming transaction."), 0);

    int64_t memo_lookup = sto_subarray(memos, memos_len, 0);
    if (memo_lookup < 0)
        rollback(SBUF("Blacklist: Memo transaction did not contain correct format."), 30);

    uint8_t *memo_ptr = SUB_OFFSET(memo_lookup) + memos;
    uint32_t memo_len = SUB_LENGTH(memo_lookup);

    int64_t memo_field = sto_subfield(memo_ptr, memo_len, sfMemo);
    if (memo_field < 0)
        rollback(SBUF("Memo field not found"), 31);

    memo_ptr = SUB_OFFSET(memo_field) + memo_ptr;
    memo_len = SUB_LENGTH(memo_field);

    TRACESTR("Raw Memo content: ");
    TRACEHEX(memo_ptr);

    int64_t data_lookup = sto_subfield(memo_ptr, memo_len, sfMemoData);
    if (data_lookup < 0)
        rollback(SBUF("MemoData not found"), 32);

    uint8_t *data_ptr = SUB_OFFSET(data_lookup) + memo_ptr;
    uint32_t data_len = SUB_LENGTH(data_lookup);

    TRACESTR("MemoData content: ");

    TRACEHEX(data_ptr);
    TRACEVAR(data_ptr);
    TRACESTR(data_ptr);

    // if any of these lookups fail the request is malformed
    /* if (data_lookup < 0 || format_lookup < 0)
        rollback(SBUF("Blacklist: Memo transaction did not contain correct memo format."), 40); */

    /*int64_t memo_lookup = sto_subarray(memos, memos_len, 1);

    uint8_t*  memo_ptr = SUB_OFFSET(memo_lookup) + memos;
    uint32_t  memo_len = SUB_LENGTH(memo_lookup);

    int64_t blob_size = otxn_field(SBUF(doc_hash), sfMemos);

    TRACESTR(doc_hash); */

    /* if (blob_size < 0)
        rollback(SBUF("Document hash not found"), 2);

    if (blob_size < 0)
        rollback(SBUF("Document hash not found"), 2);

    TRACESTR(doc_hash); */

    if (BUFFER_EQUAL_20(param_buffer, PARAM_REGISTER))
    {
        uint8_t existing_value[32];
        int64_t existing = state(SBUF(existing_value), SBUF(doc_hash));
        if (existing >= 0)
            rollback(SBUF("Document already registered"), 3);

        if (state_set(SBUF(doc_hash), SBUF(doc_hash)) < 0)
            rollback(SBUF("Error registering document"), 4);

        accept(SBUF("Document registered successfully"), 0);
        return 0;
    }

    if (BUFFER_EQUAL_20(param_buffer, PARAM_SIGN))
    {
        uint8_t existing_value[32];
        int64_t existing = state(SBUF(existing_value), SBUF(doc_hash));
        if (existing < 0)
            rollback(SBUF("Document not found for signing"), 5);

        uint8_t signer_acc[20];
        int64_t signer_acc_size = otxn_field(SBUF(signer_acc), sfAccount);
        if (signer_acc_size < 0)
            rollback(SBUF("Error getting sender account"), 3);

        /*uint8_t signature_key[34];
        CLEARBUF(signature_key);
        if (util_keylet(SBUF(signature_key), KEYLET_SIGNERS, SBUF(doc_hash), SBUF(signer_acc), 0, 0) != 34)
            rollback(SBUF("Notary: Internal error, could not generate signature_key"), 10);*/

        uint8_t signature_key[32];

        for (int i = 0; GUARD(32), i < 32; ++i)
            signature_key[i] = doc_hash[i];
        for (int i = 0; GUARD(20), i < 20; ++i)
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

    _g(1, 1);

    return 0;
}
