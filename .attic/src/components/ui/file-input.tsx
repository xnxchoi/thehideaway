import {Label} from '@/components/ui/label'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import Image from 'next/image'

export default function Component() {
	return (
		<div className="mx-auto max-w-md space-y-6">
			<form className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="file">File</Label>
					<div className="w-full" />
					<div className="mt-2">
						<Image src="/placeholder.svg" alt="File preview" width="300" height="200"
						       className="rounded-md"
						       style={{aspectRatio: '300/200', objectFit: 'cover'}} />
					</div>
				</div>
				<Button type="submit" className="w-full">
					Upload
				</Button>
			</form>
		</div>
	)
}
