import type { NextPageContext } from "next";

export const authRedirect = (context: NextPageContext) => {
  const req = context.req;
  const res = context.res;
  if (!res) return { props: {} };
  // Redirect to login if user is not logged in
  if (!req?.user) {
    res.setHeader("location", "/login");
    res.statusCode = 302;
    res.end();
    return { props: {} };
  }
  if (req.user.type === "incomplete") {
    res.setHeader("location", "/complete-profile");
    res.statusCode = 302;
    res.end();
    return { props: {} };
  }
  return { props: { user: req?.user } };
};
