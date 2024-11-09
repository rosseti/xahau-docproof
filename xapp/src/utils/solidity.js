export const processError = (error) => {
  const reason =
    error.data?.message || error.reason || "An unexpected error has occurred.";
  return translateError(reason);
};

export const translateError = (reason) => {
    return reason
        .replace("VM Exception while processing transaction: reverted with reason string '", "")
        .replace("'", "");
};
