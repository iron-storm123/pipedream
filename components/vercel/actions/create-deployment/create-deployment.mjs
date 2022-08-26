import vercel from "../../vercel.app.mjs";

export default {
  key: "vercel-create-deployment",
  name: "Create Deployment",
  description: "Create a new deployment from a GitHub repository. [See the docs](https://vercel.com/docs/rest-api#endpoints/deployments/create-a-new-deployment)",
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
    name: {
      type: "string",
      label: "Name",
      description: "A string with the project name used in the deployment URL",
    },
    project: {
      propDefinition: [
        vercel,
        "project",
        (c) => ({
          accessToken: c.accessToken,
        }),
      ],
      description: "The target project identifier in which the deployment will be created. When defined, this parameter overrides name",
    },
    repoId: {
      type: "string",
      label: "Git Source Repository Id",
      description: "Id of the source repository",
    },
    branch: {
      type: "string",
      label: "Branch",
      description: "Branch of repository to deploy to",
      default: "main",
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
    public: {
      type: "boolean",
      label: "Public",
      description: "Whether a deployment's source and logs are available publicly",
      optional: true,
    },
  },
  async run({ $ }) {
    const data = {
      name: this.name,
      project: this.project,
      teamId: this.team,
      public: this.public,
      gitSource: {
        type: "github",
        repoId: this.repoId,
        ref: this.branch,
      },
    };
    const res = await this.vercel.createDeployment({
      accessToken: this.accessToken,
      data,
      $,
    });
    $.export("$summary", "Successfully created new deployment");
    return res;
  },
};
