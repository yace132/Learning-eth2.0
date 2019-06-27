#### misc.ts
> Get proposer of current slot

	export function getBeaconProposerIndex(state: BeaconState): ValidatorIndex {}
>    
        let i = 0;
      while (true) {
        const candidateIndex = firstCommittee[(currentEpoch + i) % firstCommittee.length];
        const randByte = hash(Buffer.concat([
          generateSeed(state, currentEpoch),
          intToBytes(intDiv(i, 32), 8),
        ]))[i % 32];
        const effectiveBalance = state.validatorRegistry[candidateIndex].effectiveBalance;
        if (effectiveBalance.muln(255).gten(MAX_EFFECTIVE_BALANCE * randByte)) {
          return candidateIndex;
        }
        i += 1;
    }
>
    const randByte = hash(Buffer.concat([
          generateSeed(state, currentEpoch),
          intToBytes(intDiv(i, 32), 8),
        ]))[i % 32];

>>`intToBytes(intDiv(i, 32), 8)`
>>>divide `i` in groups
>>>say 32 `i` forms a group
>>
>>`randByte`
>>>every group computes `randByte=hash(seed, # of group)`
>>>`randByte` has 32 bytes
>>>>`hash()` 
>>>>in `util/crypto.ts`
>>>>output bytes32

>>>each element assigns for each `i` in the same group
>>>
>>>we can conclude that this is a p.r.n.g
>>>hash(seed,0), hash(seed,1), hash(seed,2), ... ...
>>>1 random number 32 bytes, we just use 1 byte each time

    const effectiveBalance = state.validatorRegistry[candidateIndex].effectiveBalance;
        if (effectiveBalance.muln(255).gten(MAX_EFFECTIVE_BALANCE * randByte)) {
          return candidateIndex;
        }
>>`muln` and `gten` are operators of `bn.js`
>>`n` postfix, means js number
>>`gte` "g"reater "t"han or "e"qual 
>>`MAX_EFFECTIVE_BALANCE`
>>> max deposit, 32

>>`effectiveBalance.muln(255).gten(MAX_EFFECTIVE_BALANCE * randByte`
>>> that is,`effectiveBalance`>=32 * (`radnByte`/255)
>>or `effectiveBalance` >= some target random #

>>If target random # not greater than your `effectiveBalance`, you become the proposer
>>the probability is `effectiveBalance`/32
>>Thus, everone faces different target random #, you put more deposits, the chance you become the proposer is larger.
>> 
>>We only choose one person who passes the target.
>>even you are rich, there maybe someone who challenge first and become the propser

>>However, the challenge order is random
>>>`const candidateIndex = firstCommittee[(currentEpoch + i) % firstCommittee.length];` 

>>Who can challenge the test first depends on `currentEpoch` and # of current committee members(sufficient random?)
>>
>>Notice that even you are rich, that would not make you challenge first