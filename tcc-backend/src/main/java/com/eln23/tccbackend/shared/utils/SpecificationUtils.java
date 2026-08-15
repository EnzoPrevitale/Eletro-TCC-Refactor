package com.eln23.tccbackend.shared.utils;

import com.eln23.tccbackend.enums.TrialMode;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public class SpecificationUtils {

    private SpecificationUtils() {}

    private static Path<?> findPath(Path<?> root, String[] strings) {
        for (String string : strings) {
            root = root.get(string);
        }

        return root;
    }

    public static <T> Specification<T> all() {
        return (root, query, criteriaBuilder) -> criteriaBuilder.conjunction();
    }

    public static <T> Specification<T> none() {
        return (root, query, criteriaBuilder) -> criteriaBuilder.disjunction();
    }

    public static <T> Specification<T> fromString(String string, String... columns) {
        return ((root, query, criteriaBuilder) -> {
            if(string == null || string.isEmpty()) {
                return criteriaBuilder.conjunction();
            }

            Path<?> path = findPath(root, columns);

            return criteriaBuilder.like(
                    criteriaBuilder.lower(path.as(String.class)),
                    "%" + string.toLowerCase() + "%"
            );
        });
    }

    public static <T> Specification<T> fromEnum(String string, String... columns) {
        return ((root, query, criteriaBuilder) -> {
            if(string == null || string.isEmpty()) {
                return criteriaBuilder.conjunction();
            }

            Path<?> path = findPath(root, columns);

            return criteriaBuilder.like(
                    path.as(TrialMode.class).as(String.class),
                    "%" + string.toLowerCase() + "%"
            );
        });
    }

    public static <T> Specification<T> fromStringList(List<String> list, String... columns) {
        return (root, query, criteriaBuilder) -> {
            if (list == null || list.isEmpty()) return criteriaBuilder.conjunction();

            Path<?> path = findPath(root, columns);
            List<Predicate> predicates = new ArrayList<>();

            for(String i : list) {
                if(i != null && !i.isEmpty()) {
                    predicates.add(criteriaBuilder.like(
                            criteriaBuilder.lower(path.as(String.class)),
                            "%" + i.toLowerCase() + "%"
                    ));
                }
            }

            return criteriaBuilder.or(predicates.toArray(new Predicate[0]));
        };
    }

    public static <T> Specification<T> fromInteger(Integer integer, String... columns) {
        return (root, query, criteriaBuilder) -> {
            if(integer == null) return criteriaBuilder.conjunction();
            Path<?> path = findPath(root, columns);
            return criteriaBuilder.equal(path.as(Integer.class), integer);
        };
    }

    public static <T> Specification<T> fromLocalDateTime(LocalDateTime localDateTime, String... columns) {
        return (root, query, criteriaBuilder) -> {
            if(localDateTime == null) return criteriaBuilder.conjunction();
            Path<?> path = findPath(root, columns);
            return criteriaBuilder.equal(path.as(LocalDateTime.class), localDateTime);
        };
    }

    public static <T> Specification<T> fromLocalDate(LocalDate localDate, String... columns) {
        return (root, query, criteriaBuilder) -> {
            if(localDate == null) return criteriaBuilder.conjunction();
            Path<?> path = findPath(root, columns);
            return criteriaBuilder.equal(path.as(LocalDate.class), localDate);
        };
    }

    public static <T> Specification<T> fromLocalTime(LocalTime localTime, String... columns) {
        return (root, query, criteriaBuilder) -> {
            if(localTime == null) return criteriaBuilder.conjunction();
            Path<?> path = findPath(root, columns);
            return criteriaBuilder.equal(path.as(LocalTime.class), localTime);
        };
    }

    public static <T> Specification<T> fromBoolean(Boolean bool, String... columns) {
        return (root, query, criteriaBuilder) -> {
            if(bool == null) return criteriaBuilder.conjunction();
            Path<?> path = findPath(root, columns);
            return criteriaBuilder.equal(path.as(Boolean.class), bool);
        };
    }

    public static <T> Specification<T> fromEnum(Enum<?> enumValue, String... columns) {
        return (root, query, criteriaBuilder) -> {
            if(enumValue == null) return criteriaBuilder.conjunction();
            Path<?> path = findPath(root, columns);
            return criteriaBuilder.equal(path.as(enumValue.getClass()), enumValue);
        };
    }

    public static <T> Specification<T> fromDateAsString(String date, String... columns) {
        return ((root, query, criteriaBuilder) -> {
            if(date == null || date.isEmpty()) {
                return criteriaBuilder.conjunction();
            }

            Path<?> path = findPath(root, columns);

            Expression<String> formattedDate = criteriaBuilder.function(
                    "TO_CHAR",
                    String.class,
                    path,
                    criteriaBuilder.literal("DD/MM/YYYY")
            );

            return criteriaBuilder.like(
                    criteriaBuilder.lower(formattedDate),
                    "%" + date.toLowerCase() + "%"
            );
        });
    }

    public static <T> Specification<T> fromDateTimeAsString(String dateTime, String... columns) {
        return ((root, query, criteriaBuilder) -> {
            if(dateTime == null || dateTime.isEmpty()) {
                return criteriaBuilder.conjunction();
            }

            Path<?> path = findPath(root, columns);

            Expression<String> formattedDate = criteriaBuilder.function(
                    "TO_CHAR",
                    String.class,
                    path,
                    criteriaBuilder.literal("DD/MM/YYYY HH24:MI:SS")
            );

            return criteriaBuilder.like(
                    criteriaBuilder.lower(formattedDate),
                    "%" + dateTime.toLowerCase() + "%"
            );
        });
    }

    public static <T> Specification<T> fromTimeAsString(String time, String... columns) {
        return ((root, query, criteriaBuilder) -> {
            if(time == null || time.isEmpty()) {
                return criteriaBuilder.conjunction();
            }

            Path<?> path = findPath(root, columns);

            Expression<String> formattedDate = criteriaBuilder.function(
                    "TO_CHAR",
                    String.class,
                    path,
                    criteriaBuilder.literal("HH24:MI:SS")
            );

            return criteriaBuilder.like(
                    criteriaBuilder.lower(formattedDate),
                    "%" + time.toLowerCase() + "%"
            );
        });
    }

    @SuppressWarnings("unchecked")
    public static <T> Specification<T> fromListLength(Integer length, String... columns) {
        return (root, query, criteriaBuilder) -> {
            if(length == null) return criteriaBuilder.conjunction();

            Path<?> path = findPath(root, columns);
            Expression<Collection<?>> collection = (Expression<Collection<?>>) path;

            return criteriaBuilder.equal(criteriaBuilder.size(collection), length);
        };
    }

    public static <T> Specification<T> fromListLengthAsString(String length, String... columns) {
        Integer parsedLength = parseIntegerOrNull(length);

        if(parsedLength == null) {
            return (root, query, criteriaBuilder) -> criteriaBuilder.disjunction();
        }

        return fromListLength(parsedLength, columns);
    }

    private static Integer parseIntegerOrNull(String value) {
        if(value == null || value.isBlank()) return null;

        try {
            return Integer.valueOf(value.trim());
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private static Double parseDoubleOrNull(String value) {
        if(value == null || value.isBlank()) return null;

        try {
            return Double.valueOf(value.trim());
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    public static <T> Specification<T> fromDouble(Double value, String... columns) {
        return (root, query, criteriaBuilder) -> {
            if(value == null) return criteriaBuilder.conjunction();
            Path<?> path = findPath(root, columns);
            return criteriaBuilder.equal(path.as(Double.class), value);
        };
    }

    public static <T> Specification<T> fromDoubleAsString(String value, String... columns) {
        return fromDouble(parseDoubleOrNull(value), columns);
    }

    public static <T> Specification<T> fromIntegerAsString(String value, String... columns) {
        return fromInteger(parseIntegerOrNull(value), columns);
    }

    public static <T> Specification<T> fromUUID(UUID value, String... columns) {
        return (root, query, criteriaBuilder) -> {
            if(value == null) return criteriaBuilder.conjunction();
            Path<?> path = findPath(root, columns);
            return criteriaBuilder.equal(path.as(UUID.class), value);
        };
    }
}
