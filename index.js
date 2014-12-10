var argv = require('minimist')(process.argv.slice(2));

argv.token = argv.token || process.env.GITHUB_TOKEN;
argv.sha = argv.sha || process.env.GITHUB_SHA;
argv.user = argv.user || process.env.GITHUB_USER;
argv.repo = argv.repo || process.env.GITHUB_REPO;
argv.state = argv.state || process.env.GITHUB_STATE;
argv['target-url'] = argv['target-url'] || process.env.GITHUB_TARGET_URL;
argv.description = argv.description || process.env.GITHUB_DESCRIPTION;

var query;
var GitHubApi = require('github');
var github = new GitHubApi({
  version: "3.0.0",
  protocol: "https",
  timeout: 5000,
  headers: { "user-agent": "mocha-github-reporter" }
});

if (argv.token) {
  q = {
    type: "token",
    token: process.env.GITHUB_TOKEN
  };
  github.authenticate(q, function (err) {
    if (err) throw err;
  })
} else {
  throw new Error("Missing Github Token");
}

if (argv.branch || argv.sha && argv.sha.length !== 40 ) {
  withBranch(argv.user, argv.repo, argv.branch || argv.sha, function(err, branch) {
    argv.sha = branch.commit.sha;
    postUpdates();
  });
} else {
  postUpdates();
}

function withBranchPullRequest(user, repo, branchName, fn) {
  github.pullRequests.getAll({
    user: user,
    repo: repo
  }, function (err, res) {
    if (err) {
      fn(err);
    } else {
      var index = -1;

      for (var i = 0; i < res.length; i++) {
        if (res[i].head.ref === branchName) {
          index = i;
        }
      }

      if (index !== -1) {
        fn(err, res[index]);
      } else {
        fn(new Error(branchName + ' not found'));
      }
    }
  })
}

function withBranch(user, repo, branchName, fn) {
  github.repos.getBranch({
    user: user,
    repo: repo,
    branch: branchName
  }, fn)
}

function postUpdates() {
  if (argv.user && argv.repo && argv.sha && argv.state) {
    q = {
      user: argv.user,
      repo: argv.repo,
      sha: argv.sha,
      state: argv.state
    };
    if (argv['target-url']) {
      q['target_url'] = argv['target-url'];
    }
    if (argv.description) {
      q.description = argv.description;
    }
    github.statuses.create(q, function (err, res) {
      if (err) throw err;
    })
  } else {
    throw new Error('missing sha')
  }
}



