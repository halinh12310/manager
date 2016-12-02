import React from 'react';
import sinon from 'sinon';
import { mount, shallow } from 'enzyme';
import { expect } from 'chai';

import { state } from '@/data';
import { testLinode } from '@/data/linodes';
import { SHOW_MODAL } from '~/actions/modal';
import { RescuePage } from '~/linodes/linode/layouts/RescuePage';
import { expectRequest } from '@/common';

describe('linodes/linode/layouts/RescuePage', () => {
  const sandbox = sinon.sandbox.create();

  const dispatch = sandbox.spy();

  afterEach(() => {
    dispatch.reset();
    sandbox.restore();
  });

  // TODO: Please, somebody, remove this
  const linodes = {
    pagesFetched: [0],
    totalPages: 1,
    linodes: {
      [testLinode.id]: testLinode,
      1235: {
        ...testLinode,
        id: 1235,
        _disks: {
          totalPages: 1,
          totalResults: 0,
          pagesFetched: [1],
          disks: { },
        },
      },
      1236: {
        ...testLinode,
        id: 1236,
        _disks: {
          totalPages: 1,
          totalResults: 2,
          pagesFetched: [1],
          disks: {
            2234: {
              ...testLinode._disks.disks[1234],
              id: 2234,
            },
            2235: {
              ...testLinode._disks.disks[1234],
              id: 2235,
            },
          },
        },
      },
      1237: {
        ...testLinode,
        id: 1237,
        status: 'offline',
      },
    },
    _singular: 'linode',
    _plural: 'linodes',
  };

  it('fetches linode disks', async () => {
    const _dispatch = sinon.stub();
    await RescuePage.preload({ dispatch: _dispatch }, { linodeId: '1242' });

    let fn = _dispatch.secondCall.args[0];
    _dispatch.reset();
    _dispatch.returns({ total_pages: 1, disks: [], total_results: 0 });
    await fn(_dispatch, () => state);
    fn = _dispatch.firstCall.args[0];
    await expectRequest(fn, '/linode/instances/1242/disks/?page=1', undefined, {
      disks: [],
    });
  });

  describe('reset root password', () => {
    it('renders the appropriate message for Linodes without eligible disks', () => {
      const page = shallow(
        <RescuePage
          dispatch={dispatch}
          linodes={linodes}
          params={{ linodeId: '1235' }}
        />);
      page.setState({ loading: false });
      expect(page.contains(
        'This Linode does not have any disks eligible for password reset.'))
        .to.equal(true);
    });

    it('renders a PasswordInput component', () => {
      const page = mount(
        <RescuePage
          dispatch={dispatch}
          linodes={linodes}
          params={{ linodeId: '1234' }}
        />);
      page.setState({ loading: false, disk: true });
      expect(page.find('PasswordInput').length).to.equal(1);
    });

    it('renders disk selection for appropriate Linodes', () => {
      const page = shallow(
        <RescuePage
          dispatch={dispatch}
          linodes={linodes}
          params={{ linodeId: '1236' }}
        />);
      page.setState({ loading: false, disk: 2234 });
      const reset = page.find('.root-pw');
      const select = reset.find('select');
      expect(select.length).to.equal(1);
      const d = linodes.linodes[1236]._disks.disks[2234];
      expect(select.contains(<option value={d.id} key={d.id}>{d.label}</option>))
        .to.equal(true);
    });

    it('updates state when selecting disks', () => {
      const page = shallow(
        <RescuePage
          dispatch={dispatch}
          linodes={linodes}
          params={{ linodeId: '1236' }}
        />);
      page.setState({ loading: false, disk: 2234 });
      const reset = page.find('.root-pw');
      const select = reset.find('select');
      select.simulate('change', { target: { value: 2235 } });
      expect(page.state('disk')).to.equal(2235);
    });

    it('updates state when password changes', () => {
      const page = shallow(
        <RescuePage
          dispatch={dispatch}
          linodes={linodes}
          params={{ linodeId: '1234' }}
        />);
      page.setState({ loading: false, disk: 1234 });
      const reset = page.find('.root-pw');
      reset.find('PasswordInput').props().onChange('new password');
      expect(page.state('password')).to.equal('new password');
    });

    it('resets root password when button is pressed', async () => {
      const page = shallow(
        <RescuePage
          dispatch={dispatch}
          linodes={linodes}
          params={{ linodeId: '1237' }}
        />);
      page.setState({ loading: false, disk: 1234, password: 'new password' });
      const { resetRootPassword } = page.instance();
      await resetRootPassword();
      const fn = dispatch.firstCall.args[0];

      const dispatched = () => ({ authentication: { token: 'hi' } });
      await expectRequest(fn, '/linode/instances/1237/disks/1234/password', dispatched,
                         { }, { method: 'POST' });
    });

    it('shows a modal when reset root password button is pressed', async () => {
      const page = shallow(
        <RescuePage
          dispatch={dispatch}
          linodes={linodes}
          params={{ linodeId: '1237' }}
        />);
      page.setState({ loading: false, disk: 1234, password: 'new password' });
      page.find('.reset-root-pw-button').simulate('click');
      expect(dispatch.calledOnce).to.equal(true);
      expect(dispatch.firstCall.args[0])
        .to.have.property('type').which.equals(SHOW_MODAL);
    });

    it('shows disks in rescue mode', async () => {
      const page = mount(
        <RescuePage
          dispatch={dispatch}
          linodes={linodes}
          params={{ linodeId: '1234' }}
        />);
      page.setState({ diskSlots: [12345, 12346] });
      // iterate through the labels, there should be two disks and one for Finnix
      expect(page.find('.label-col').map(node => node.text())).to.deep.equal([
        '/dev/sda',
        '/dev/sdb',
        '/dev/sdh',
      ]);
    });
  });
});
