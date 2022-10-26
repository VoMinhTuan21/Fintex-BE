import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { createMap, forMember, mapFrom, Mapper } from '@automapper/core';
import { Injectable } from '@nestjs/common';
import { Education } from '../../schemas';
import { EducationResDto } from '../../dto/response/education';

@Injectable()
export class EducationProfile extends AutomapperProfile {
    constructor(@InjectMapper() mapper: Mapper) {
        super(mapper);
    }

    override get profile() {
        return (mapper: Mapper) => {
            createMap(
                mapper,
                Education,
                EducationResDto,
                forMember(
                    (destination) => destination._id,
                    mapFrom((source) => source._id),
                ),
                forMember(
                    (destination) => destination.name,
                    mapFrom((source) => source.name),
                ),
            );
        };
    }
}
