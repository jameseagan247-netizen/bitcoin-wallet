import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { ECPairFactory } from "ecpair";

bitcoin.initEccLib(ecc);

const ECPair = ECPairFactory(ecc);

export function generateBitcoinAddress(): string {
  const keyPair = ECPair.makeRandom();

  const payment = bitcoin.payments.p2wpkh({
    pubkey: Buffer.from(keyPair.publicKey),
    network: bitcoin.networks.bitcoin,
  });

  if (!payment.address) {
    throw new Error("Failed to generate Bitcoin address");
  }

  return payment.address;
}