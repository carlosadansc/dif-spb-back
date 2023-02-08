module.exports = {
  ERR0000: {
    code: "ERR0000",
    title: "INTERNAL_SERVER_ERROR",
    description: "An unexpected error has occurred. Please try again later.",
  },
  ERR0001: {
    code: "ERR0001",
    title: "NOT_FOUND",
    description: "The requested resource was not found",
  },
  ERR0002: {
    code: "ERR0002",
    title: "CANNOT_UPDATE_DUE_TO_OUTDATED_DATA",
    description: "The data you are trying to update is outdated. Please refresh the page and try again.",
  },
  ERR0003: {
    code: "ERR0003",
    title: "INVALID_PAGINATION_FORMAT",
    description: "Ensure that the pagination parameters are in the correct format",
  },
  ERR0004: {
    code: "ERR0004",
    title: "INVALID_PAGINATION_LIMIT",
    description: "Ensure that the pagination limit is between 1 and 100",
  },
  ERR0005: {
    code: "ERR0005",
    title: "INVALID_PARAMETERS",
    description: "Ensure that at least one parameter is brought",
  },
  ERR0006: {
    code: "ERR0006",
    title: "MISSING_PARAMETERS",
    description: "Ensure that all required parameters are brought",
  },
  ERR0007: {
    code: "ERR0007",
    title: "DUPLICATED_KEY",
    description: "Ensure that the key is unique",
  },
  ERR0008: {
    code: "ERR0008",
    title: "BAD_REQUEST",
    description: "Ensure that the request is correct",
  },
  ERR0009: {
    code: "ERR0009",
    title: "METHOD_DEPRECATED",
    description: "The method is deprecated",
  },
  ERR0010: {
    code: "ERR0010",
    title: "DATABASE_UNAVAILABLE",
    description: "The database is unavailable",
  },
  ERR0011: {
    code: "ERR0011",
    title: "SERVICE_UNAVAILABLE",
    description: "The service is unavailable",
  },
  ERR0012: {
    code: "ERR0012",
    title: "COLUMN_NOT_FOUND",
    description: "Document not found",
  },
  ERR0013: {
    code: "ERR0013",
    title: "DUPLICATED_ID_FOUND",
    description: "Duplicated id found",
  },
  ERR0014: {
    code: "ERR0014",
    title: "ITEM_INACTIVE",
    description: "Item is inactive",
  },
  ERR0015: {
    code: "ERR0015",
    title: "RULE_NOT_APPLY",
    description: "Rule does not apply",
  },
  ERR0016: {
    code: "ERR0016",
    title: "UNIQUE_VIOLATION",
    description: "Unique violation",
  },
  ERR0017: {
    code: "ERR0017",
    title: "INVALID_PASSWORD",
    description: "Password provided is not valid",
  },

  // Token
  ERR0018: {
    code: "ERR0018",
    title: "INVALID_OR_NULL_TOKEN",
    description: "Token provided is not valid",
  },
  ERR0019: {
    code: "ERR0019",
    title: "TOKEN_EXPIRED",
    description: "Token provided is expired",
  },
  ERR0020: {
    code: "ERR0020",
    title: "UNAUTHORIZED",
    description: "User type unauthorized for this request",
  },


  // Booking Module
  ERR0100: {
    code: "ERR0100",
    title: "BOOKING_MODULE",
    description: "Incorrect value for nights parameter, arrival and departure does not match.",
  },
  ERR0101: {
    code: "ERR0101",
    title: "BOOKING_MODULE",
    description: "Incorrect value for nights parameter, value must be a number.",
  },
  ERR0102: {
    code: "ERR0102",
    title: "COMMON_ERRORS",
    description: "Incorrect value for arrival, value must be a date",
  },
  ERR0103: {
    code: "ERR0103",
    title: "COMMON_ERRORS",
    description: "Incorrect value for departure, value must be a date",
  },
  ERR0104: {
    code: "ERR0104",
    title: "BOOKING_MODULE",
    description: "Incorrect value for nights parameter, value must be a positive number.",
  },
  ERR0105: {
    code: "ERR0105",
    title: "BOOKING_MODULE",
    description: "Incorrect value for room category, value must be a string",
  },
  ERR0106: {
    code: "ERR0106",
    title: "BOOKING_MODULE",
    description: "Maximum characters for room category reached",
  },
  ERR0107: {
    code: "ERR0107",
    title: "BOOKING_MODULE",
    description: "Room category can not be null",
  },
  ERR0108: {
    code: "ERR0108",
    title: "BOOKING_MODULE",
    description: "Incorrect value for room category pms, value must be a string",
  },
  ERR0109: {
    code: "ERR0109",
    title: "BOOKING_MODULE",
    description: "Maximum characters for room category pms reached",
  },
  ERR0110: {
    code: "ERR0110",
    title: "BOOKING_MODULE",
    description: "Room category pms can not be null",
  },
  ERR0111: {
    code: "ERR0111",
    title: "BOOKING_MODULE",
    description: "arrival date can not be major than departure date",
  },
  ERR0200: {
    code: "ERR0200",
    title: "BOOKING_SENDING_MODULE",
    description: "Incorrect date range",
  }
};
