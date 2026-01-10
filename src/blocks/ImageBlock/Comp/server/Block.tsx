type RPImageBlockProps = {
	serverProps: {
		readonly span?: number;
	}
}
const ImageBlock = ({
	                    serverProps: {
		                    span: spanFromProps = 100
	                    }
                    }: RPImageBlockProps) => {
	const span = spanFromProps;
}
export default ImageBlock;