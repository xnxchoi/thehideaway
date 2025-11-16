import type {SaveButtonServerProps} from "payload";
import {RP_SaveButton} from "./SaveClient";

const SaveServerComponent = (props: SaveButtonServerProps) => {
	const {label, ...rest} = props;
	return <RP_SaveButton label={label} />;
};
export default SaveServerComponent;
