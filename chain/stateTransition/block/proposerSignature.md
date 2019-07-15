#### proposerSignature.ts

    
    export default function processProposerSignature(state: BeaconState, block: BeaconBlock): void {}
>
      const b: BeaconBlock = {
        ...block,
        signature: EMPTY_SIGNATURE,
      };
>> ( "..." is [spread operator](https://basarat.gitbooks.io/typescript/docs/spread-operator.html) of typescript )
>> add EMPTY_SIGNATURE to block
>> so it would be accepted by hashTreeRoot() function
>
      const blockWithoutSignatureRoot: bytes32 = hashTreeRoot(b, BeaconBlock);
>> get b's root
>
      const p: ProposalSignedData = {
        slot: state.slot,
        shard: 2**32, // TODO this will get removed in update to more recent spec
        blockRoot: blockWithoutSignatureRoot,
      };
      const proposalRoot = hashTreeRoot(p, ProposalSignedData);
>> validator sign slot and blockRoot

      const blockSignatureVerified = blsVerify( state.validatorRegistry[getBeaconProposerIndex(state, state.slot)].pubkey,
        proposalRoot,
        block.signature,
        getDomain(state.fork, getCurrentEpoch(state), Domain.PROPOSAL),
      );

      assert(blockSignatureVerified);
>> verify signatures
>> content is proposalRoot
>> signature is block.signature
>> notice the validators for this block