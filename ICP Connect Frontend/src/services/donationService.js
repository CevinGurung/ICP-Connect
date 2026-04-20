import api from "./api";

export const initiateDonation = async (amount, message) => {
  const response = await api.post("/api/donations/initiate", { amount, message });
  return response.data;
};

export const confirmDonation = async (transactionUuid) => {
  const response = await api.post("/api/donations/confirm", { transactionUuid });
  return response.data;
};
