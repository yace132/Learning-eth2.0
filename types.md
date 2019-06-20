# types


# Study ChainSafe's eth2.0 implementation


## Notes :memo:
### types/   
#### operations.ts
>attestation
>
	export interface Attestation {
	  // Attester participation bitfield
	  aggregationBitfield: bytes;
	  // Attestation data
	  data: AttestationData;
	  // Proof of custody bitfield
	  custodyBitfield: bytes;
	  // BLS aggregate signature
	  signature: BLSSignature;
	}
>>attestation: new eth2.0 chain data with signatures 
>>attestation consists of data, signature, and bitfields
>>
>>data: new eth2.0 "block"s
>>>new epoch ( sets of block or special block of beacon chain )
>>>new block ( block of beacon chain )
>>>new crosslink ( block of shard )

>> signature: add "all signatures" together
>>> signatures of different people -- aggregate together
>>> signatures of different custodyBit -- add different types signatures
>>> People sign the same data with 0 or 1

>>bitfields: use binary to represent signers   