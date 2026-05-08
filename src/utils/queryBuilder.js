export const queryBuilder = async ({
    model,
    query,

    searchableFields = [],
    filterableFields = [],

    sortableFields = [],

    numberFields = [],
    booleanFields = [],

    defaultSort = { created_at: "desc" },
}) => {
    // Pagination
    const page = parseInt(query.page) || 1;

    const limit = Math.min(parseInt(query.limit) || 24, 100);

    const skip = (page - 1) * limit;

    // Search
    const search = query.search;

    // Sorting
    const sortBy = sortableFields.includes(query.sortBy)
        ? query.sortBy
        : Object.keys(defaultSort)[0];

    const order =
        query.order === "asc" || query.order === "desc"
            ? query.order
            : Object.values(defaultSort)[0];

    const where = {};

    // Search
    if (search && searchableFields.length) {
        where.OR = searchableFields.map((field) => ({
            [field]: {
                contains: search,
                mode: "insensitive",
            },
        }));
    }

    // Filters
    filterableFields.forEach((field) => {
        if (query[field] !== undefined) {
            let value = query[field];

            // Convert numbers
            if (numberFields.includes(field)) {
                value = parseInt(value);

                if (isNaN(value)) return;
            }

            // Convert booleans
            if (booleanFields.includes(field)) {
                value = value === "true";
            }

            where[field] = value;
        }
    });

    // Query
    const [data, total] = await Promise.all([
        model.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                [sortBy]: order,
            },
        }),

        model.count({ where }),
    ]);

    return {
        data,

        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};