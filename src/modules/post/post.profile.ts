import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { createMap, forMember, mapFrom, Mapper } from '@automapper/core';
import { Injectable } from '@nestjs/common';
import { Post } from '../../schemas/post.schema';
import { PostResDto } from '../../dto/response/post.dto';

@Injectable()
export class PostProfile extends AutomapperProfile {
    constructor(@InjectMapper() mapper: Mapper) {
        super(mapper);
    }

    override get profile() {
        return (mapper: Mapper) => {
            createMap(
                mapper,
                Post,
                PostResDto,
                forMember(
                    (destination) => destination._id,
                    mapFrom((source) => source._id),
                ),
                forMember(
                    (destination) => destination.content,
                    mapFrom((source) => source.content),
                ),
                forMember(
                    (destination) => destination.feeling,
                    mapFrom((source) => source.feeling),
                ),
                forMember(
                    (destination) => destination.visibleFor,
                    mapFrom((source) => source.visibleFor),
                ),
                forMember(
                    (destination) => destination.images,
                    mapFrom((source) => source.images),
                ),
                forMember(
                    (destination) => destination.reaction,
                    mapFrom((source) => source.reactions),
                ),
            );
        };
    }
}
