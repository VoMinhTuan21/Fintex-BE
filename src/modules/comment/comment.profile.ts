import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { createMap, forMember, mapFrom, Mapper } from '@automapper/core';
import { Injectable } from '@nestjs/common';
import { Comment } from '../../schemas';
import { CommnentResDto } from '../../dto/response/comment.dto';

@Injectable()
export class UserProfile extends AutomapperProfile {
    constructor(@InjectMapper() mapper: Mapper) {
        super(mapper);
    }

    override get profile() {
        return (mapper: Mapper) => {
            createMap(
                mapper,
                Comment,
                CommnentResDto,
                forMember(
                    (destination) => destination._id,
                    mapFrom((source) => source._id),
                ),
                forMember(
                    (destination) => destination.level,
                    mapFrom((source) => source.level),
                ),
                forMember(
                    (destination) => destination.content,
                    mapFrom((source) => source.content),
                ),
                forMember(
                    (destination) => destination.image,
                    mapFrom((source) => source.image),
                ),
                forMember(
                    (destination) => destination.parentId,
                    mapFrom((source) => source.parentId),
                ),
            );
        };
    }
}
