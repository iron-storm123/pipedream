import vercel from "../../vercel.app.mjs";

export default {
  key: "vercel-cancel-deployment",
  name: "Cancel Deployment",
  description: "Cancel a deployment which is currently building. [See the docs](https://vercel.com/docs/rest-api#endpoints/deployments/cancel-a-deployment)",
  version: "0.1.0",
  type: "action",
  props: {
    vercel,
    accessToken: {
      propDefinition: [
        vercel,
        "accessToken",
      ],
    },
    deployment: {
      propDefinition: [
        vercel,
        "deployment",
        (c) => ({
          accessToken: c.accessToken,
          state: "BUILDING",
        }),
      ],
    },
    team: {
      propDefinition: [
        vercel,
        "team",
        (c) => ({
          accessToken: c.accessToken,
        }),
      ],
    },
  },
  async run({ $ }) {
    const params = {
      teamId: this.team,
    };
    const res = await this.vercel.cancelDeployment({
      accessToken: this.accessToken,
      id: this.deployment,
      params,
      $,
    });
    $.export("$summary", `Successfully canceled deployment ${this.deployment}`);
    return res;
  },
};
