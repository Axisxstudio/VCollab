package com.vtechai.vcollab.tagging;

import com.vtechai.vcollab.tagging.entity.SystemTag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Seeds system audience tags into the database on startup (only if not already present).
 * These tags are used by the @mention suggestion system to target specific student groups.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SystemTagSeeder implements ApplicationRunner {

    private final SystemTagRepository systemTagRepository;

    @Override
    public void run(ApplicationArguments args) {
        if (systemTagRepository.count() > 0) {
            return; // Already seeded
        }

        List<SystemTag> tags = List.of(
            // ─── School Tags ─────────────────────────────────────────────────
            tag("school_Grade1",  "Grade 1 Students",   "education_type=SCHOOL&grade=Grade 1",  "school"),
            tag("school_Grade2",  "Grade 2 Students",   "education_type=SCHOOL&grade=Grade 2",  "school"),
            tag("school_Grade3",  "Grade 3 Students",   "education_type=SCHOOL&grade=Grade 3",  "school"),
            tag("school_Grade4",  "Grade 4 Students",   "education_type=SCHOOL&grade=Grade 4",  "school"),
            tag("school_Grade5",  "Grade 5 Students",   "education_type=SCHOOL&grade=Grade 5",  "school"),
            tag("school_Grade6",  "Grade 6 Students",   "education_type=SCHOOL&grade=Grade 6",  "school"),
            tag("school_Grade7",  "Grade 7 Students",   "education_type=SCHOOL&grade=Grade 7",  "school"),
            tag("school_Grade8",  "Grade 8 Students",   "education_type=SCHOOL&grade=Grade 8",  "school"),
            tag("school_Grade9",  "Grade 9 Students",   "education_type=SCHOOL&grade=Grade 9",  "school"),
            tag("school_Grade10", "Grade 10 Students",  "education_type=SCHOOL&grade=Grade 10", "school"),
            tag("school_OL",      "O/L Students",       "education_type=SCHOOL&grade=OL",       "school"),
            tag("school_AL",      "A/L Students",       "education_type=SCHOOL&grade=AL",       "school"),

            // ─── University Year × Semester Tags ──────────────────────────────
            tag("1styear_1stsem", "1st Year – 1st Semester", "education_type=UNIVERSITY&year=Year 1&semester=Semester 1", "university"),
            tag("1styear_2ndsem", "1st Year – 2nd Semester", "education_type=UNIVERSITY&year=Year 1&semester=Semester 2", "university"),
            tag("2ndyear_1stsem", "2nd Year – 1st Semester", "education_type=UNIVERSITY&year=Year 2&semester=Semester 1", "university"),
            tag("2ndyear_2ndsem", "2nd Year – 2nd Semester", "education_type=UNIVERSITY&year=Year 2&semester=Semester 2", "university"),
            tag("3rdyear_1stsem", "3rd Year – 1st Semester", "education_type=UNIVERSITY&year=Year 3&semester=Semester 1", "university"),
            tag("3rdyear_2ndsem", "3rd Year – 2nd Semester", "education_type=UNIVERSITY&year=Year 3&semester=Semester 2", "university"),
            tag("4thyear_1stsem", "4th Year – 1st Semester", "education_type=UNIVERSITY&year=Year 4&semester=Semester 1", "university"),
            tag("4thyear_2ndsem", "4th Year – 2nd Semester", "education_type=UNIVERSITY&year=Year 4&semester=Semester 2", "university"),

            // ─── Popular Institution Tags ──────────────────────────────────────
            tag("SLIIT",          "SLIIT Students",          "institution_name=SLIIT",                   "institution"),
            tag("UoM",            "University of Moratuwa",  "institution_name=University of Moratuwa",  "institution"),
            tag("UoC",            "University of Colombo",   "institution_name=University of Colombo",   "institution"),
            tag("NSBM",           "NSBM Green University",   "institution_name=NSBM",                    "institution"),
            tag("IIT",            "Informatics Institute",   "institution_name=IIT",                     "institution")
        );

        systemTagRepository.saveAll(tags);
        log.info("Seeded {} system audience tags", tags.size());
    }

    private SystemTag tag(String tagName, String label, String mapped, String icon) {
        return SystemTag.builder()
            .tagName(tagName)
            .label(label)
            .tagType("SYSTEM")
            .mappedAttribute(mapped)
            .icon(icon)
            .build();
    }
}
