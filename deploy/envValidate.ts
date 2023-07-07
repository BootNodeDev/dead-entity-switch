import dotenv from "dotenv";
dotenv.config();

const validate = (variable: string): string => {
  if (!process.env[variable]) {
    throw Error(`Missing process.env.${variable}`);
  }

  return process.env[variable] || "";
};

export const getPrivateKeyOwner = () => {
  return {
    PK_OWNER: validate("PK_OWNER"),
  };
};

export const getFactoryAddress = () => {
  return {
    FACTORY: validate("FACTORY"),
  };
};

export const getEnvs = () => {
  const factory = getFactoryAddress();
  const owner = getPrivateKeyOwner();

  return {
    ...factory,
    ...owner,
    DESA_ACCOUNT: validate("DESA_ACCOUNT"),
    PK_BENEFICIARY: validate("PK_BENEFICIARY"),
  };
};
