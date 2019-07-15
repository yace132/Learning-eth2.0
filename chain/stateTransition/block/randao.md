#### randao.ts
>
    export default function processRandao(state: BeaconState, block: BeaconBlock): void {}
> in processRandao()
    
    const currentEpoch = getCurrentEpoch(state);
    const proposer = state.validatorRegistry[getBeaconProposerIndex(state, state.slot)];
      const randaoRevealVerified = blsVerify(
        proposer.pubkey,
        intToBytes(currentEpoch, 32),
        block.randaoReveal,
        getDomain(state.fork, currentEpoch, Domain.PROPOSAL),
      );
      assert(randaoRevealVerified);
      state.latestRandaoMixes[currentEpoch % LATEST_RANDAO_MIXES_LENGTH] =
        xor(getRandaoMix(state, currentEpoch), hash(block.randaoReveal));
>> `block.randaoReveal` 
>> a signature
>> proposer sign # of epoch as seed of RandaoMixes
>>create a random # for each "slot"
>>genearate proposer for each "slot"
>>for the same epoch, proposers sign same number( current epoch )
>>> so proposer can't sign other # to affect randaoMix 


>> `state.latestRandaoMixes` latest random #s
>>> update every block
>>> for the same epoch, update `state.latestRandaoMixes` of the same index, use last RandaoMixes with same index
>>> for next epoch, update the next element in `state.latestRandaoMixes`

>> `LATEST_RANDAO_MIXES_LENGTH`= 2**13 ~ 8000
>> 

>> decide RandaoMix of `currentEpoch`
>> xor old RandaoMix (of `currentEpoch` k)and `block.randaoReveal`
>> if no `state.latestRandaoMixes`, use `hash(block.randaoReveal)` as seed(xor with 0 is itself) 