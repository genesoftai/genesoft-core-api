import { File } from "@modules/metadata/entity/file.entity";

export type FileWithUrl = File & { url: string };
