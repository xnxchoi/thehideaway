import {uuid, varchar} from "@payloadcms/db-postgres/drizzle/pg-core";
import {sql} from "@payloadcms/db-postgres/drizzle";
import {PostgresSchemaHook} from "node_modules/@payloadcms/drizzle/dist/postgres/types";

const nanoIdFields =
	/((version_)?(((user)|(target)|(post)|(author)|(impersonated_by)|(inviter)|(cited)|(recipient)|(allow_list)|(owner))s?))(_?id)/i;
const fieldsVarcharPreserve = /^(provider|account)_id$/i;

function isUUIDorVarcharColumn(col: unknown) {
	return (
		(typeof col === "object" &&
			col &&
			"columnType" in col &&
			(col?.columnType === "PgVarchar" || col?.columnType === "PgUUID")) ||
		false
	);
}

export const afterSchemaInit: PostgresSchemaHook = ({
	schema,
	extendTable,
}) => {
	const tables = Object.entries(schema.tables);
	let i = 0;
	for (const [tableName, table] of tables) {
		const tableColumns = Object.entries(table);
		const idCol = tableColumns.find((r) => r[0] === "id")?.[1];

		const idComm = isUUIDorVarcharColumn(idCol);
		const isTg = ["users", "posts"].some((r) => r === tableName);
		const idf = idComm
			? isTg
				? varchar("id", {length: 12}).primaryKey().default(sql`nanoid(12)`)
				: (idCol.columnType as string).toLowerCase().includes("varchar") ||
				(idCol.columnType as string).toLowerCase().includes("uuid")
					? uuid("id").primaryKey().default(sql`uuidv7()`)
					: false
			: false;
		if (idf) {
			extendTable({
				table: table,
				columns: {
					id: idf,
					...tableColumns.reduce((acc, [columnName, column]) => {
						if (/_id$/.test(column.name)) {
							if (!fieldsVarcharPreserve.test(column.name)) {
								const doNotNull =
									"notNull" in column ? (column.notNull ?? false) : false;
								const hasDefault =
									("hasDefault" in column && column.hasDefault) || false;
								let type: "varchar" | "uuid" = "uuid";

								if (nanoIdFields.test(column.name)) {
									type = "varchar";
								} else if (/(_?)(parent_id)$/i.test(column.name)) {
									if (column.columnType.toLowerCase().includes("serial"))
										return acc;

									if (
										!/^((_(user_(media|views))_v)|(user_(media|views)))(_rels)?/.test(
											tableName,
										) &&
										/(^((((post)|(user))s?)(((_([a-z]+))|([a-z]*))+)$))|(^_(((post)|(user))s_v)$)/i.test(
											tableName,
										)
									) {
										type = "varchar";
									} else if (
										column.columnType.toLowerCase().includes("serial") ||
										(!/(((([a-z]+_)|([a-z]))+)_(locales|rels))$/.test(
												tableName,
											) &&
											(column.columnType.toLowerCase().includes("varchar") ||
												!column.columnType.toLowerCase().includes("uuid")))
									) {
										return acc;
									}
								}

								const requiresDefault = "default" in column && column.default;

								let field;
								if (type === "varchar") {
									field = doNotNull
										? hasDefault
											? varchar(column.name, {
												length: 12,
											}).notNull().default(sql`nanoid(12)`)
											: varchar(column.name, {length: 12}).notNull()
										: varchar(column.name, {
											length: 12,
										});
								} else {
									field = doNotNull
										? hasDefault
											? uuid(column.name).notNull().default(sql`uuidv7()`)
											: uuid(column.name).notNull()
										: uuid(column.name);
								}
								return {
									...acc,
									[columnName]: field,
								};
							}
						}
						return acc;
					}, {}),
				},
			});
		} else {
			extendTable({
				table: table,
				columns: {
					...tableColumns.reduce((acc, [columnName, column]) => {
						if (/_id$/.test(column.name)) {
							if (!fieldsVarcharPreserve.test(column.name)) {
								const doNotNull =
									"notNull" in column ? (column.notNull ?? false) : false;
								const hasDefault =
									("hasDefault" in column && column.hasDefault) || false;
								let type: "varchar" | "uuid" = "uuid";

								if (nanoIdFields.test(column.name)) {
									type = "varchar";
								} else if (/(_?)(parent_id)$/i.test(column.name)) {
									if (column.columnType.toLowerCase().includes("serial"))
										return acc;
									if (
										!/^((_(user_(media|views))_v)|(user_(media|views)))(_rels)?/.test(
											tableName,
										) &&
										/(^((((post)|(user))s?)(((_([a-z]+))|([a-z]*))+)$))|(^_(((post)|(user))s_v)$)/i.test(
											tableName,
										)
									) {
										type = "varchar";
									} else if (
										!/(((([a-z]+_)|([a-z]))+)_(locales|rels))$/.test(
											tableName,
										) &&
										(column.columnType.toLowerCase().includes("varchar") ||
											!column.columnType.toLowerCase().includes("uuid"))
									) {
										return acc;
									}
								}

								const requiresDefault = "default" in column && column.default;

								let field;
								if (type === "varchar") {
									field = doNotNull
										? hasDefault
											? varchar(column.name, {
												length: 12,
											}).notNull().default(sql`nanoid(12)`)
											: varchar(column.name, {length: 12}).notNull()
										: varchar(column.name, {
											length: 12,
										});
								} else {
									field = doNotNull
										? hasDefault
											? uuid(column.name).notNull().default(sql`uuidv7()`)
											: uuid(column.name).notNull()
										: uuid(column.name);
								}
								return {
									...acc,
									[columnName]: field,
								};
							}
						}
						return acc;
					}, {}),
				},
			});
		}
	}

	return schema;
};
