export const queryBuilder = async ({
    model,
    query,
    searchableFields = [],
    filterableFields = [],
    sortableFields = [],
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

    // WHERE conditions
    const where = {};

    // Searchable fields
    if (search && searchableFields.length) {
        where.OR = searchableFields.map((field) => ({
            [field]: {
                contains: search,
                mode: "insensitive",
            },
        }));
    }

    // Exact filters
    filterableFields.forEach((field) => {
        if (query[field]) {
            where[field] = query[field];
        }
    });

    // Query DB
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