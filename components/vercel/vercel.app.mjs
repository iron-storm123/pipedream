import { ConfigurationError } from "@pipedream/platform";
import { axios } from "@pipedream/platform";
import constants from "./constants.mjs";

export default {
  type: "app",
  app: "vercel",
  propDefinitions: {
    accessToken: {
      type: "string",
      label: "Access Token",
      description: "Use your personal access token created through Vercel UI instead of the OAuth token",
      secret: true,
      optional: true,
    },
    project: {
      type: "string",
      label: "Project",
      description: "Filter deployments from the given projectId",
      optional: true,
      async options({ accessToken }) {
        try {
          const projects = await this.listProjects({
            accessToken,
          });
          return projects?.map((project) => ({
            label: project.name,
            value: project.id,
          })) ?? [];
        } catch (error) {
          const { message } = error;
          const {
            status,
            statusText,
          } = error.response;
          throw new ConfigurationError(`Prop Configuration Error: ${status} - ${statusText} - ${message}`);
        }
      },
    },
    deployment: {
      type: "string",
      label: "Deployment",
      description: "Select the deployment to cancel",
      async options({
        accessToken, state,
      }) {
        const params = {};
        if (state) params.state = state;
        try {
          const deployments = await this.listDeployments({
            accessToken,
            params,
          });
          return deployments?.map((deployment) => ({
            label: deployment.name,
            value: deployment.uid,
          })) ?? [];
        } catch (error) {
          return this.propConfigurationError(error);
        }
      },
    },
    team: {
      type: "string",
      label: "Team",
      description: "The Team identifier or slug to perform the request on behalf of",
      optional: true,
      async options({ accessToken }) {
        try {
          const teams = await this.listTeams({
            accessToken,
          });
          return teams?.map((team) => ({
            label: team.slug,
            value: team.id,
          })) ?? [];
        } catch (error) {
          return this.propConfigurationError(error);
        }
      },
    },
    state: {
      type: "string",
      label: "State",
      description: "Filter deployments based on their state",
      optional: true,
      options: constants.DEPLOYMENT_STATES,
    },
    max: {
      type: "integer",
      label: "Max",
      description: "Maximum number of results to return",
      optional: true,
    },
  },
  methods: {
    propConfigurationError(error) {
      const { message } = error;
      const {
        status,
        statusText,
      } = error.response;
      throw new ConfigurationError(`Prop Configuration Error: ${status} - ${statusText} - ${message}`);
      // return [
      //   `Prop Configuration Error: ${status} - ${statusText} - ${message}`,
      // ];
    },
    authHeader(accessToken) {
      const token = accessToken
        ? accessToken
        : this.$auth.oauth_access_token;
      return {
        Authorization: `Bearer ${token}`,
      };
    },
    async makeRequest(config, $) {
      const {
        accessToken,
        ...params
      } = config;
      config = {
        ...params,
        url: `https://api.vercel.com/${config.endpoint}`,
        headers: {
          ...this.authHeader(accessToken),
          "User-Agent": "@PipedreamHQ/pipedream v0.1",
        },
      };
      delete config.endpoint;
      return axios($ ?? this, config);
    },
    /**
    * Paginate through a list of resources in Vercel
    * @params {String} resource - Resource type (e.g. "projects", "deployments", "teams").
    * The response from makeRequest() will contain an array of results with the specified
    * resource as the key and the array as the value
    * @params {Object} config - configuration variables for the request
    * @params {Integer} max - the maximum number of results to return
    * @returns {Array} An array of results
    */
    async paginate(resource, config, max = constants.MAX_RESULTS, $) {
      const allResults = [];
      config.params = {
        ...config.params,
        limit: constants.PAGE_SIZE,
      };
      let results;
      do {
        results = await this.makeRequest(config, $);
        config.params.from = results?.pagination?.next;
        config.params.since = results?.pagination?.next;
        allResults.push(...results[resource]);
      } while (results?.pagination?.count === config.limit && allResults.length < max);
      if (allResults.length > max) {
        allResults.length = max;
      }
      return allResults;
    },
    async listProjects({
      accessToken, max, $,
    }) {
      const config = {
        method: "GET",
        endpoint: "v8/projects",
        accessToken,
      };
      return this.paginate("projects", config, max, $);
    },
    async listDeployments({
      accessToken, params, max, $,
    }) {
      const config = {
        method: "GET",
        endpoint: "v6/deployments",
        accessToken,
        params,
      };
      return this.paginate("deployments", config, max, $);
    },
    async listTeams({
      accessToken, max, $,
    }) {
      const config = {
        method: "GET",
        endpoint: "v2/teams",
        accessToken,
      };
      return this.paginate("teams", config, max, $);
    },
    async cancelDeployment({
      accessToken, id, params, $,
    }) {
      const config = {
        method: "PATCH",
        endpoint: `v12/deployments/${id}/cancel`,
        accessToken,
        params,
      };
      return this.makeRequest(config, $);
    },
    async createDeployment({
      accessToken, data, $,
    }) {
      const config = {
        method: "POST",
        endpoint: "v13/deployments",
        accessToken,
        data,
      };
      if (data.teamId) {
        config.endpoint += `?teamId=${data.teamId}`;
      }
      delete data.teamId;
      return this.makeRequest(config, $);
    },
  },
};
