#### attestation.ts
>
	export function getAttestingIndices(
	  state: BeaconState,
	  attestationData: AttestationData,
	  bitfield: bytes
	): ValidatorIndex[]
>>
	const crosslinkCommittee =
		getCrosslinkCommittee(state, attestationData.targetEpoch, attestationData.shard);
>> Get indices of committee of `attestationData.shard`,`attestationData.targetEpoch`
>> 
	assert(verifyBitfield(bitfield, crosslinkCommittee.length));
>> Check that `bitfield`'s format is consitent with `crosslinkCommittee`
>>
	return crosslinkCommittee
		.filter((_, i) =>  getBitfieldBit(bitfield, i) === 0b1)
>> Get indices of who vote 1
>> "0b" is prefix of js binary representation
>> 
	.sort();
>> sort by deafult order, Unicode

> Returns the i-th bit of `bitfield`
> 
	export function getBitfieldBit(bitfield: bytes, i: number): number {
	  const bit = i % 8;
	  const byte = intDiv(i,  8);
	  return (bitfield[byte] >> bit) & 1;
	}

>> bitfield
>> [ 7 6 5 4 3 2 1 0-th bit,
>> 15 14 13 12 11 10 9 8-th bit,
>>  ... ]


> Check format of bitfield
> 
	export function verifyBitfield(bitfield: bytes, committeeSize: number): boolean {}
>Check bitfield matches committee size
>
	  if (bitfield.length !== intDiv(committeeSize + 7, 8)) {
		return false;
	  }
>> 1 validator 1 bit
>> `committeeSize` = 1,2,3,4,5,6,7,8	--> 1 byte
>> `committeeSize` = 9,10,11,12,13,14,15,16	--> 2 bytes
>> `committeeSize` = 17,18,19,20,21,22,23,24	--> 3 bytes
>>	  
	  for (let i = committeeSize; i < bitfield.length * 8; i++) {
		if (getBitfieldBit(bitfield, i) === 0b1) {
		  return false;
		}
	  }
>> Check `bitfield` is padded with zero bits only
>	  
	export function convertToIndexed(state: BeaconState, attestation: Attestation): IndexedAttestation
>>
	const attestingIndices =
    getAttestingIndices(state, attestation.data, attestation.aggregationBitfield);
>> Who attest in committee of `attestation.data`
>>
	const custodyBit1Indices =
    getAttestingIndices(state, attestation.data, attestation.custodyBitfield);
>>
	const custodyBit0Indices = attestingIndices.filter((i) => custodyBit1Indices.includes(i));
>> Get who attests but has custodoy bit 1
>> 
	return {
		custodyBit0Indices,
		custodyBit1Indices,
		data: attestation.data,
		signature: attestation.signature,
	  }; 
>
	export function verifyIndexedAttestation(
	  state: BeaconState,
	  indexedAttestation: IndexedAttestation
	): bool
>>
	const custodyBit0Indices = indexedAttestation.custodyBit0Indices;
	  const custodyBit1Indices = indexedAttestation.custodyBit1Indices;
>>

	  const custodyBit0IndicesSet = new Set(custodyBit0Indices);
	  const duplicates = new Set(
		custodyBit1Indices.filter((i) => custodyBit0IndicesSet.has(i))
	  );
	  assert(duplicates.size === 0);
>>Ensure no duplicate indices across bit0 and bit1
>>
	// TO BE REMOVED IN PHASE 1
	  if (custodyBit0Indices.length > 0) {
		return false;
	  }
>>
	const totalAttestingIndices = custodyBit0Indices.length + custodyBit1Indices.length;
	  if (!(1 <= totalAttestingIndices && totalAttestingIndices <= MAX_INDICES_PER_ATTESTATION)) {
		return false;
	  }
>>Check length
>>
	const sortedCustodyBit0Indices = custodyBit0Indices.slice().sort();
	  if (!custodyBit0Indices.every((index, i) => index === sortedCustodyBit0Indices[i])) {
		return false;
	  }

	  const sortedCustodyBit1Indices = custodyBit1Indices.slice().sort();
	  if (!custodyBit1Indices.every((index, i) => index === sortedCustodyBit1Indices[i])) {
		return false;
	  }
>> Use `sort()` to shallow copy indices, sort again and compare with input indices
>> 
	return bls.verifyMultiple(
		[
		  bls.aggregatePubkeys(sortedCustodyBit0Indices.map((i) => state.validatorRegistry[i].pubkey)),
		  bls.aggregatePubkeys(sortedCustodyBit1Indices.map((i) => state.validatorRegistry[i].pubkey)),
		], [
		  hashTreeRoot({
			data: indexedAttestation.data,
			custodyBit: 0b0,
		  }, AttestationDataAndCustodyBit),
		  hashTreeRoot({
			data: indexedAttestation.data,
			custodyBit: 0b1,
		  }, AttestationDataAndCustodyBit),
		],
		indexedAttestation.signature,
		getDomain(state, Domain.ATTESTATION, slotToEpoch(indexedAttestation.data.targetEpoch)),
	  );
>>
	bls.verifyMultiple(
		[pubkeys],
		[message hashes],
		signature,
		domain
	)
>>	Use BLS scheme, even multiple people with different messages, we can "add" all signautes
>>	The "signatue sum" can still be verified
>>	The verification process is different with normal verification
>>	So we need new function `bls.verifyMultiple()`
>>	( We can also apply BLS scheme to another case -- all people sign the same message ) 
>>
	[
	  bls.aggregatePubkeys(sortedCustodyBit0Indices.map((i) => state.validatorRegistry[i].pubkey)),
	  bls.aggregatePubkeys(sortedCustodyBit1Indices.map((i) => state.validatorRegistry[i].pubkey)),
	]
>> `map()` collects public keys
>> `aggeratePubkeys()` aggergates public key array 
>>
	[
		  hashTreeRoot({
			data: indexedAttestation.data,
			custodyBit: 0b0,
		  }, AttestationDataAndCustodyBit),
		  hashTreeRoot({
			data: indexedAttestation.data,
			custodyBit: 0b1,
		  }, AttestationDataAndCustodyBit),
		]
>> validtors sign `indexedAttestation.data` with different custodybit
>> 
	indexedAttestation.signature
>> 2 types signature adds together