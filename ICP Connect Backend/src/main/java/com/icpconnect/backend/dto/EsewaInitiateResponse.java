package com.icpconnect.backend.dto;



public record EsewaInitiateResponse(
    String amount,
    String taxAmount,
    String totalAmount,
    String transactionUuid,
    String productCode,
    String productServiceCharge,
    String productDeliveryCharge,
    String successUrl,
    String failureUrl,
    String signedFieldNames,
    String signature,
    String esewaUrl
) {}
