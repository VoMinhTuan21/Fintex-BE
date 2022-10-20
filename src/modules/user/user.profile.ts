import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { createMap, forMember, mapFrom, Mapper } from '@automapper/core';
import { Injectable } from '@nestjs/common';
import { User } from '../../schemas/user.schema';
import { UserResDto } from '../../dto/response';

@Injectable()
export class UserProfile extends AutomapperProfile {
    constructor(@InjectMapper() mapper: Mapper) {
        super(mapper);
    }

    override get profile() {
        return (mapper: Mapper) => {
            createMap(
                mapper,
                User,
                UserResDto,
                forMember(
                    (destination) => destination._id,
                    mapFrom((source) => source._id),
                ),
                forMember(
                    (destination) => destination.name,
                    mapFrom((source) => source.name),
                ),
                forMember(
                    (destination) => destination.email,
                    mapFrom((source) => source.email),
                ),
                forMember(
                    (destination) => destination.phone,
                    mapFrom((source) => source.phone),
                ),
                forMember(
                    (destination) => destination.avatar,
                    mapFrom((source) => source.avatar),
                ),
                forMember(
                    (destination) => destination.coverPhoto,
                    mapFrom((source) => source.coverPhoto),
                ),
                forMember(
                    (destination) => destination.birthday,
                    mapFrom((source) => source.birthday),
                ),
                forMember(
                    (destination) => destination.gender,
                    mapFrom((source) => source.gender),
                ),
                forMember(
                    (destination) => destination.address,
                    mapFrom((source) => source.address),
                ),
                forMember(
                    (destination) => destination.education,
                    mapFrom((source) => source.education),
                ),
            );
        };
    }
}
