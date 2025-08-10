'use client'
import {Label} from "@/components/ui/label";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group";
import {useField} from "@payloadcms/ui";

const AuthorityFieldComponent = ({path}: { path: string }) => {
	const {value, setValue} = useField<number>({path});
	const options = [
		{value: 3, label: "Editor"},
		{value: 2, label: "Author"},
		{value: 1, label: "Patron"},
		{value: 0, label: "User"},
	];
	return <RadioGroup defaultValue={`${value}`}
	                   onValueChange={(value) => setValue(parseInt(value, 10))}
	                   className={'w-full'}>
		{options.map((option) => (
			<div className={'flex w-full '} key={'a' + option.value}>
				<RadioGroupItem key={'b' + option.value} value={`${option.value}`} />
				<Label>이 글을 {option.label} 이상 등급의 사용자에게 공개</Label>
			</div>
		))}
	</RadioGroup>
}
export default AuthorityFieldComponent;
