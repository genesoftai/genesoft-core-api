import { Injectable } from "@nestjs/common";
import { File } from "./entity/file.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { SaveFileDto, SaveReferenceLinkDto } from "./dto/save-metadata";
import { ReferenceLink } from "./entity/reference-link.entity";

@Injectable()
export class MetadataService {
    constructor(
        @InjectRepository(File)
        private readonly fileRepository: Repository<File>,
        @InjectRepository(ReferenceLink)
        private readonly referenceLinkRepository: Repository<ReferenceLink>,
    ) {}

    async saveFile(payload: SaveFileDto): Promise<File> {
        return this.fileRepository.save({
            name: payload.name,
            description: payload.description,
            type: payload.type,
            bucket: payload.bucket,
            path: payload.path,
        });
    }

    async saveReferenceLink(
        payload: SaveReferenceLinkDto,
    ): Promise<ReferenceLink> {
        return this.referenceLinkRepository.save({
            name: payload.name,
            description: payload.description,
            url: payload.url,
        });
    }
}
