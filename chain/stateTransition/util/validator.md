#### validator.ts
>
	export function isActiveValidator(validator: Validator, epoch: Epoch): boolean {
  	return validator.activationEpoch <= epoch && epoch < validator.exitEpoch;
	}
>> active: activate and not exit
>
	export function isSlashableValidator(validator: Validator, epoch: Epoch): boolean {
	  return (
		!validator.slashed &&
		validator.activationEpoch <= epoch &&
		epoch < validator.withdrawableEpoch
	  );
	}
>>We can slash misbehave validator as soon as validator activates
>>We slash validator before validator withdraws 
>>

>
	export function getActiveValidatorIndices(state: BeaconState, epoch: Epoch): ValidatorIndex[] {
	  return state.validatorRegistry.reduce((indices, validator, index) => {
		if (isActiveValidator(validator, epoch)) {
		  indices.push(index);
		}
		return indices;
	  }, []);
	}