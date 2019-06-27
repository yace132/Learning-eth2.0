#### attestations.ts
> Check the format of attestation ( informations of eth2.0 )
    export function processAttestation(state: BeaconState, attestation: Attestation): void {}
> 
  
    assert(
    attestationSlot + MIN_ATTESTATION_INCLUSION_DELAY <= state.slot &&
    state.slot <= attestationSlot + SLOTS_PER_EPOCH
    );
>> `MIN_ATTESTATION_INCLUSION_DELAY` 
>>> 4 slots

>> We need to wait before `processAttestation` 
>>> at least 4 slots
    
>> `prcessAttestation` can't be too late
>>> We need to process in 1 epoch ( may cross epoch? )
>>> 

    assert((
        currentEpoch === data.targetEpoch &&
        state.currentJustifiedEpoch === data.sourceEpoch &&
        state.currentJustifiedRoot.equals(data.sourceRoot) &&
        hashTreeRoot(state.currentCrosslinks[data.shard], Crosslink).equals(data.previousCrosslinkRoot)
      ) || (
        previousEpoch === data.targetEpoch &&
        state.previousJustifiedEpoch === data.sourceEpoch &&
        state.previousJustifiedRoot.equals(data.sourceRoot) &&
        hashTreeRoot(state.previousCrosslinks[data.shard], Crosslink).equals(data.previousCrosslinkRoot)
      ));
>> Attestation consists of 3 parts: epoch, block and shard
>> 1st condition we hope
>>> for epoch, 
>>> `state.currentJustifiedEpoch` -->  `currentEpoch`

>>> for shard,
>>> `state.currentCrosslinks[data.shard]` --> `data.crosslinkDataRoot`
 
>> 2nd condition we hope ???

> For phase 0, we simplify shard chain
> 
	assert(data.crosslinkDataRoot.equals(ZERO_HASH));

>
	  assert(verifyIndexedAttestation(state, convertToIndexed(state, attestation)));
>> `convertToIndexed()` changes the format of attestation
>> Replace bitfields with validator indices
>> 
>> `verifyIndexedAttestation()` extracts validators' pubkeys by validator indices and verify bls signature of attestation
>> 
	const pendingAttestation: PendingAttestation = {
		data,
		aggregationBitfield: attestation.aggregationBitfield,
		inclusionDelay: state.slot - attestationSlot,
		proposerIndex: getBeaconProposerIndex(state),
	  };
	  
	if (data.targetEpoch === currentEpoch) {
		state.currentEpochAttestations.push(pendingAttestation);
	  } else {
		state.previousEpochAttestations.push(pendingAttestation);
	  }
>> Cache attestations of epoch
>> Remove custody bit informations and signature
>> Add inclusionDelay and current beacon proposer

> Check formats of attestations of new block
>
	export default function processAttestations(state: BeaconState, block: BeaconBlock): void {
	  assert(block.body.attestations.length <= MAX_ATTESTATIONS);
	  for (const attestation of block.body.attestations) {
		processAttestation(state, attestation);
	  }
>> 1 block has many attestations, process them