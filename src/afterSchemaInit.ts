import { sql } from "@payloadcms/db-postgres/drizzle";
import { uuid, varchar } from "@payloadcms/db-postgres/drizzle/pg-core";
import { PostgresSchemaHook } from "node_modules/@payloadcms/drizzle/dist/postgres/types";

const nanoIdFields =
  /((version_)?(((user)|(target)|(post)|(author)|(impersonated_by)|(inviter)|(cited)|(recipient)|(allow_list)|(owner))s?))(_?id)/i;
const fieldsVarcharPreserve = /^(source|provider|account)_id$/i;
const JOB_TABLES = new Set([
  "payload_jobs_log",
  "search_tags",
  "search_author",
  "search_allow_list"
]);

function isUUIDorVarcharColumn(col: unknown) {
  return (
    (typeof col === "object" &&
      col &&
      "columnType" in col &&
      (col?.columnType === "PgVarchar" || col?.columnType === "PgUUID")) ||
    false
  );
}

function varcharLenFor(tableName: string) {
  return JOB_TABLES.has(tableName) ? 24 : 12;
}

export const afterSchemaInit: PostgresSchemaHook = ({
  schema,
  extendTable
}) => {
  const tables = Object.entries(schema.tables);
  for (const [tableName, table] of tables) {
    const tableColumns = Object.entries(table);
    const idCol = tableColumns.find((r) => r[0] === "id")?.[1];

    const idComm = isUUIDorVarcharColumn(idCol);
    const isTg = ["users", "posts"].some((r) => r === tableName);
    const idf = JOB_TABLES.has(tableName) // Force ObjectId-style string IDs for internal Payload job tables
      ? varchar("id", { length: varcharLenFor(tableName) }).primaryKey()
      : // || (isTg &&
        // 	varchar("id", {length: 12}).primaryKey().
        // 		default(sql`nanoid(12)`)
        // )
        idComm
        ? (((idCol.columnType as string).toLowerCase().includes("varchar") ||
            (idCol.columnType as string).toLowerCase().includes("uuid")) &&
            uuid("id")
              .primaryKey()
              .default(sql`uuidv7()`)) ||
          false
        : false;
    if (idf) {
      extendTable({
        table: table,
        columns: {
          id: idf,
          ...tableColumns.reduce((acc, [columnName, column]) => {
            if (/_id$/.test(column.name)) {
              if (/^((([a-z]+_?)*)([a-z]+_))?(hash_id)$/.test(column.name)) {
                if (/^hash_id$/.test(column.name)) {
                  return {
                    ...acc,
                    [columnName]: varchar(column.name, { length: 11 })
                      .notNull()
                      .default(sql`nanoid(11)`)
                  };
                }
                return {
                  ...acc,
                  [columnName]: varchar(column.name, { length: 11 }).notNull()
                };
              }

              if (!fieldsVarcharPreserve.test(column.name)) {
                const doNotNull =
                  "notNull" in column ? (column.notNull ?? false) : false;
                const hasDefault =
                  ("hasDefault" in column && column.hasDefault) || false;
                // let type: "varchar" | "uuid" = "uuid";
                // if (nanoIdFields.test(column.name)) {
                // 	type = "varchar";
                // } else
                if (/(_?)(parent_id)$/i.test(column.name)) {
                  if (column.columnType.toLowerCase().includes("serial"))
                    return acc;

                  // else if (
                  // 	(column.columnType.toLowerCase().includes("serial") ||
                  // 		(!/(((([a-z]+_)|([a-z]))+)_(locales|rels))$/.test(
                  // 				tableName,
                  // 			) &&
                  // 			(column.columnType.toLowerCase().
                  // 					includes("varchar") ||
                  // 				!column.columnType.toLowerCase().
                  // 					includes("uuid"))))
                  // ) {
                  // 	return acc;
                  // }
                }

                const requiresDefault = "default" in column && column.default;

                const field = // (type === "varchar") ?
                  // 	(doNotNull
                  // 			? hasDefault
                  // 				? varchar(column.name).
                  // 					notNull().
                  // 					default(sql`nanoid
                  //                     (12)`)
                  // 				: varchar(column.name,
                  // 					{
                  // 						length: nanoIdFields.test(
                  // 							tableName) ? 12 : varcharLenFor(
                  // 							tableName)
                  // 					}).
                  // 					notNull()
                  // 			: varchar(column.name,
                  // 				{length: varcharLenFor(tableName)})
                  // 	) :
                  doNotNull
                    ? hasDefault
                      ? uuid(column.name)
                          .notNull()
                          .default(sql`uuidv7()`)
                      : uuid(column.name).notNull()
                    : uuid(column.name);
                return {
                  ...acc,
                  [columnName]: field
                };
              }
            }
            return acc;
          }, {})
        }
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
                // let type: "varchar" | "uuid" = "uuid";
                // if (JOB_TABLES.has(tableName)) {
                // 	type = "varchar";
                // }

                // if (nanoIdFields.test(column.name)) {
                // 	type = "varchar";
                // } else
                if (/(_?)(parent_id)$/i.test(column.name)) {
                  if (column.columnType.toLowerCase().includes("serial"))
                    return acc;
                  // if (
                  // 	!/^((_(user_(media|views))_v)|(user_(media|views)))(_rels)?/.test(
                  // 		tableName,
                  // 	) &&
                  // 	/(^((((post)|(user))s?)(((_([a-z]+))|([a-z]*))+)$))|(^_(((post)|(user))s_v)$)/i.test(
                  // 		tableName,
                  // 	)
                  // ) {
                  // 	type = "varchar";
                  // }
                  // else if (
                  // 	!/(((([a-z]+_)|([a-z]))+)_(locales|rels))$/.test(
                  // 		tableName,
                  // 	) &&
                  // 	(column.columnType.toLowerCase().includes("varchar") ||
                  // 		!column.columnType.toLowerCase().includes("uuid"))
                  // ) {
                  // 	return acc;
                  // }
                }

                const requiresDefault = "default" in column && column.default;

                // let field;
                // if (type === "varchar") {
                // 	field = doNotNull
                // 		? hasDefault
                // 			? varchar(column.name,
                // 				{length: varcharLenFor(tableName)}).notNull().
                // 				default(sql`nanoid
                //                 (
                //                 ${varcharLenFor(tableName)}
                //                 )`)
                // 			: varchar(column.name,
                // 				{length: varcharLenFor(tableName)}).notNull()
                // 		: varchar(column.name, {length: varcharLenFor(tableName)});
                // } else
                // {
                const field = doNotNull
                  ? hasDefault
                    ? uuid(column.name)
                        .notNull()
                        .default(sql`uuidv7()`)
                    : uuid(column.name).notNull()
                  : uuid(column.name);
                // }
                return {
                  ...acc,
                  [columnName]: field
                };
              }
            }
            return acc;
          }, {})
        }
      });
    }
  }

  return schema;
};
