#include "hookapi.h"

// Seguindo exemplo do Wietse:
// https://gist.github.com/WietseWind/e8e1510fe114ae76cfac1b65b06b129f

#define PARAM_REGISTER "REGISTER"
#define PARAM_SIGN "SIGN"

#define MAX_MEMO_SIZE 4096
#define MINIMUM_FUTURE_LEDGER 60

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

    uint32_t payload_len = 0;
    uint8_t *payload_ptr = 0;

    // if there is a memo present then we are in mode 1 above, but we need to ensure the user isn't invoking
    // undefined behaviour by making them pick either mode 1 or mode 2:

    if (memos_len <= 0)
        accept(SBUF("Notary: Incoming txn without memo, passing."), 0);

    if (memos_len > 0)
    {
        // since our memos are in a buffer inside the hook (as opposed to being a slot) we use the sto api with it
        // the sto apis probe into a serialized object returning offsets and lengths of subfields or array entries
        int64_t memo_lookup = sto_subarray(memos, memos_len, 0);
        uint8_t *memo_ptr = SUB_OFFSET(memo_lookup) + memos;
        uint32_t memo_len = SUB_LENGTH(memo_lookup);

        // memos are nested inside an actual memo object, so we need to subfield
        // equivalently in JSON this would look like memo_array[i]["Memo"]
        memo_lookup = sto_subfield(memo_ptr, memo_len, sfMemo);
        memo_ptr = SUB_OFFSET(memo_lookup) + memo_ptr;
        memo_len = SUB_LENGTH(memo_lookup);

        if (memo_lookup < 0)
            rollback(SBUF("Notary: Incoming txn had a blank sfMemos, abort."), 1);

        int64_t format_lookup = sto_subfield(memo_ptr, memo_len, sfMemoFormat);
        uint8_t *format_ptr = SUB_OFFSET(format_lookup) + memo_ptr;
        uint32_t format_len = SUB_LENGTH(format_lookup);

        int is_text_hex = 0;
        BUFFER_EQUAL_STR_GUARD(is_text_hex, format_ptr, format_len, "text/hex", 1);
        if (!is_text_hex)
            accept(SBUF("Notary: Memo is an invalid format. Passing txn."), 50);

        int64_t data_lookup = sto_subfield(memo_ptr, memo_len, sfMemoData);
        uint8_t *data_ptr = SUB_OFFSET(data_lookup) + memo_ptr;
        uint32_t data_len = SUB_LENGTH(data_lookup);

        if (data_len > MAX_MEMO_SIZE)
            rollback(SBUF("Notary: Memo too large (4kib max)."), 4);

        for (int i = 0; GUARD(32), i < 32; ++i)
            doc_hash[i] = data_ptr[i];

        TRACEHEX(doc_hash);
    }

    int is_param_register = 0, is_param_sign = 0;

    BUFFER_EQUAL_STR_GUARD(is_param_register, param_buffer, param_size, PARAM_REGISTER, 1);
    BUFFER_EQUAL_STR_GUARD(is_param_sign, param_buffer, param_size, PARAM_SIGN, 1);

    if (is_param_register > 0)
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

    if (is_param_sign > 0)
    {
        uint8_t existing_value[32];
        int64_t existing = state(SBUF(existing_value), SBUF(doc_hash));
        if (existing < 0)
            rollback(SBUF("Document not found for signing"), 5);

        uint8_t signer_acc[20];
        int64_t signer_acc_size = otxn_field(SBUF(signer_acc), sfAccount);

        if (signer_acc_size < 0)
            rollback(SBUF("Error getting sender account"), 3);

        uint8_t signature_key[52];

        for (int i = 0; GUARD(32), i < 32; ++i)
            signature_key[i] = doc_hash[i];
        for (int i = 0; GUARD(20), i < 20; ++i)
            signature_key[i + 32] = signer_acc[i];

        uint8_t existing_sig[52];
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
