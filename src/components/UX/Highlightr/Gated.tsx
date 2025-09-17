'use client'

import {useQuery} from '@tanstack/react-query'
import {Locked} from "@/components/UX/Locked/Locked";
import RichText from "@/payload/fields/RichText";
import {useRPSession} from "@/lib/auth/session/RP_SessionProvider";
import {Shaped} from "@/components/core/s";


export default function LockedGate({
	id,
	collection = 'posts',
}: {
	id: string
	collection?: 'posts'|'delta'
}) {
	const user=useRPSession(r=>r.id as null|string);
	const {isError,isSuccess,isPending,isLoading,data:gatedContent} = useQuery({
		queryKey: ['gated', collection, id,user],
		queryFn: ({ signal }) => fetchGated(collection, id,  ),
		refetchOnWindowFocus: false,


	})

	if (isPending) return <Locked/>
	if (isError) return <Locked/>
	if (isSuccess&&gatedContent) {
		return <RichText data={gatedContent.content} enableGutter={false}/>
	}
	return <Locked/>
}

async function fetchGated<T extends 'posts'|'delta'>(collection: T, id: string, ): Promise<Shaped<T>> {


	return  await fetch(`/api/gated/${collection}/${id}`, {
		method:'get',
		credentials: 'include',
		headers: { Accept: 'application/json' },
	}).then(async res=>await res.json() as Promise<{data:Shaped<typeof collection>;collection:string}>).then(r=>{
		if(r&&r.data){
			const {data}=r;
			return data;
		}
		throw new Error('Failed to fetch gated content')
	})

}