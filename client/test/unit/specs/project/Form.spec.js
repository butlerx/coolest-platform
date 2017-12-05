import Vue from 'vue';
import vueUnitHelper from 'vue-unit-helper';
import ProjectForm from '!!vue-loader?inject!@/project/Form';

describe('ProjectForm component', () => {
  let vm;
  const sandbox = sinon.sandbox.create();
  const ProjectServiceMock = {
    get: sandbox.stub(),
    create: sandbox.stub(),
  };
  const ProjectFormWithMocks = ProjectForm({
    '@/project/service': ProjectServiceMock,
  });

  beforeEach(() => {
    vm = vueUnitHelper(ProjectFormWithMocks);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('computed', () => {
    describe('projectPayload', () => {
      it('should return a single object from projectDetails, participants and supervisor', () => {
        // ARRANGE
        vm.projectDetails = {
          id: 'foo',
          name: 'MyProject',
          description: 'Some desc',
          category: 'scratch',
          dojoId: 'bar',
        };
        vm.participants = [{
          firstName: 'Namey',
          lastName: 'McNameface',
          dob: '2006-11-03T00:00:00.000Z',
          specialRequirements: 'Allergic to nuts',
          gender: 'female',
        },
        {
          firstName: 'Other',
          lastName: 'McNameface',
          dob: '2003-01-27T00:00:00.000Z',
          specialRequirements: '',
          gender: 'male',
        }];
        vm.supervisor = {
          firstName: 'Adulty',
          lastName: 'McAdultface',
          email: 'adult@example.com',
          phone: '0851234567',
        };

        // ASSERT
        expect(vm.projectPayload).to.deep.equal({
          id: 'foo',
          name: 'MyProject',
          description: 'Some desc',
          category: 'scratch',
          dojoId: 'bar',
          users: [
            {
              firstName: 'Namey',
              lastName: 'McNameface',
              dob: '2006-11-03T00:00:00.000Z',
              specialRequirements: 'Allergic to nuts',
              gender: 'female',
              type: 'member',
            },
            {
              firstName: 'Other',
              lastName: 'McNameface',
              dob: '2003-01-27T00:00:00.000Z',
              specialRequirements: '',
              gender: 'male',
              type: 'member',
            },
            {
              firstName: 'Adulty',
              lastName: 'McAdultface',
              email: 'adult@example.com',
              phone: '0851234567',
              type: 'supervisor',
            },
          ],
        });
      });

      it('should update projectDetails, participants and supervisor from set object', () => {
        // ARRANGE
        const project = {
          id: 'foo',
          name: 'MyProject',
          description: 'Some desc',
          category: 'scratch',
          dojoId: 'bar',
          users: [
            {
              firstName: 'Namey',
              lastName: 'McNameface',
              dob: '2006-11-03T00:00:00.000Z',
              specialRequirements: 'Allergic to nuts',
              gender: 'female',
              type: 'member',
            },
            {
              firstName: 'Other',
              lastName: 'McNameface',
              dob: '2003-01-27T00:00:00.000Z',
              specialRequirements: '',
              gender: 'male',
              type: 'member',
            },
            {
              firstName: 'Adulty',
              lastName: 'McAdultface',
              email: 'adult@example.com',
              phone: '0851234567',
              type: 'supervisor',
            },
          ],
        };

        // ACT
        vm.projectPayload = project;

        // ASSERT
        expect(vm.projectDetails).to.deep.equal({
          id: 'foo',
          name: 'MyProject',
          description: 'Some desc',
          category: 'scratch',
          dojoId: 'bar',
        });
        expect(vm.participants).to.deep.equal([
          {
            firstName: 'Namey',
            lastName: 'McNameface',
            dob: '2006-11-03T00:00:00.000Z',
            specialRequirementsProvided: true,
            specialRequirements: 'Allergic to nuts',
            gender: 'female',
          },
          {
            firstName: 'Other',
            lastName: 'McNameface',
            dob: '2003-01-27T00:00:00.000Z',
            specialRequirementsProvided: false,
            specialRequirements: '',
            gender: 'male',
          },
        ]);
        expect(vm.supervisor).to.deep.equal({
          firstName: 'Adulty',
          lastName: 'McAdultface',
          email: 'adult@example.com',
          phone: '0851234567',
        });
      });
    });
  });

  describe('watchers', () => {
    describe('numParticipants', () => {
      it('should add to the participants array when number increases', () => {
        // ARRANGE
        vm.participants = [{}, {}];

        // ACT
        vm.$watchers.numParticipants(3, 2);

        // ASSERT
        expect(vm.participants).to.deep.equal([{}, {}, {}]);
      });

      it('should remove from the participants array when number decreases', () => {
        // ARRANGE
        vm.participants = [{}, {}];

        // ACT
        vm.$watchers.numParticipants(1, 2);

        // ASSERT
        expect(vm.participants).to.deep.equal([{}]);
      });

      it('should do nothing when number stays the same', () => {
        // ARRANGE
        vm.participants = [{}, {}];

        // ACT
        vm.$watchers.numParticipants(2, 2);

        // ASSERT
        expect(vm.participants).to.deep.equal([{}, {}]);
      });
    });
  });

  describe('methods', () => {
    describe('fetchDojos', () => {
      it('should update this.dojos with the a list of dojos from zen', async () => {
        // ARRANGE
        sandbox.stub(Vue.http, 'post').withArgs('https://zen.coderdojo.com/api/2.0/dojos', {
          query: {
            verified: 1,
            deleted: 0,
            fields$: ['id', 'name'],
            sort$: {
              name: 1,
            },
          },
        }).resolves({ body: 'bar' });

        // ACT
        await vm.fetchDojos();

        // ASSERT
        expect(vm.dojos).to.equal('bar');
      });
    });

    describe('onSubmit', () => {
      it('should create the project with ProjectService then go to a confirmation page', async () => {
        // ARRANGE
        const project = {
          name: 'bar',
          users: [{
            type: 'supervisor',
          }],
        };
        vm.event = {
          id: 'foo',
        };
        vm.projectPayload = project;
        ProjectServiceMock.create.resolves();
        vm.$router = {
          push: sandbox.stub(),
        };

        // ACT
        await vm.onSubmit();

        // ASSERT
        expect(ProjectServiceMock.create).to.have.been.calledOnce;
        expect(ProjectServiceMock.create).to.have.been.calledWith('foo', project);
        expect(vm.$router.push).to.have.been.calledOnce;
        expect(vm.$router.push).to.have.been.calledWith({
          name: 'CreateProjectCompleted',
          params: { eventId: 'foo' },
        });
      });
    });
  });

  describe('created()', () => {
    it('should fetch dojos', () => {
      // ARRANGE
      sandbox.stub(vm, 'fetchDojos');

      // ACT
      vm.$lifecycleMethods.created();

      // ASSERT
      expect(vm.fetchDojos).to.have.been.calledOnce;
    });
  });
});
