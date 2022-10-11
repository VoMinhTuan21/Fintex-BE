import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { createMap, forMember, mapFrom, Mapper } from '@automapper/core';
import { Injectable } from '@nestjs/common';
import { User } from '../../schemas/user.schema';
import { StrangerDto, UserResDto } from '../../dto/response';
import { Stranger } from '../../types/classes/user';

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
                    (destination) => destination.birthday,
                    mapFrom((source) => source.birthday),
                ),
                forMember(
                    (destination) => destination.gender,
                    mapFrom((source) => source.gender),
                ),
            );
            createMap(
                mapper,
                Stranger,
                StrangerDto,
                forMember(
                    (destination) => destination._id,
                    mapFrom((source) => source._id),
                ),
                forMember(
                    (destination) => destination.fullName,
                    mapFrom((source) => source.name.fullName),
                ),
                forMember(
                    (destination) => destination.avatar,
                    mapFrom((source) => source.avatar),
                ),
                forMember(
                    (destination) => destination.address,
                    mapFrom((source) => source.address),
                ),
            );
        };
    }
}
